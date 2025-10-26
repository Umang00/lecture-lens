/**
 * RSS Feed scraper
 */

import Parser from 'rss-parser';
import type { Scraper, ScrapedContent } from './types';
import { validateRssUrl } from './validators';

const parser = new Parser({
  customFields: {
    item: ['description', 'content', 'content:encoded', 'summary'],
  },
});

/**
 * Scrape RSS feed
 */
async function scrapeRss(url: string): Promise<ScrapedContent> {
  try {
    const feed = await parser.parseURL(url);

    if (!feed || !feed.items || feed.items.length === 0) {
      throw new Error('RSS feed is empty or invalid');
    }

    // Combine all feed items into a single content document
    const items = feed.items.slice(0, 20); // Limit to latest 20 items

    const content = items
      .map((item, index) => {
        const title = item.title || 'Untitled';
        const description =
          item.contentEncoded ||
          item.content ||
          item.description ||
          item.summary ||
          '';
        const link = item.link || '';
        const pubDate = item.pubDate || item.isoDate || '';

        return `## ${title}\n\nPublished: ${pubDate}\nLink: ${link}\n\n${description}\n\n---\n`;
      })
      .join('\n');

    return {
      title: feed.title || 'RSS Feed',
      content,
      metadata: {
        feedTitle: feed.title,
        feedDescription: feed.description,
        feedLink: feed.link,
        itemCount: items.length,
        lastBuildDate: feed.lastBuildDate,
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
      },
    };
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('RSS feed not found (404)');
    }
    if (error.message.includes('timeout')) {
      throw new Error('RSS feed request timed out');
    }
    if (error.message.includes('Invalid XML')) {
      throw new Error('RSS feed contains invalid XML');
    }
    throw new Error(`Failed to scrape RSS feed: ${error.message}`);
  }
}

export const rssScraper: Scraper = {
  name: 'rss',
  validate: validateRssUrl,
  scrape: scrapeRss,
};
