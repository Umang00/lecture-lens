/**
 * Blog/article scraper using Cheerio
 */

import * as cheerio from 'cheerio';
import type { Scraper, ScrapedContent } from './types';
import { validateBlogUrl } from './validators';

/**
 * Scrape blog article content
 */
async function scrapeBlog(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title (try multiple selectors)
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      'Untitled Article';

    title = title.trim();

    // Extract main content
    let content = '';

    // Try common article content selectors
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main article',
      '[itemprop="articleBody"]',
      '.content',
      'main',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Remove unwanted elements
        element.find('script, style, nav, header, footer, aside, .comments, .related-posts').remove();

        content = element.text();
        if (content.length > 200) {
          // Found substantial content
          break;
        }
      }
    }

    // Fallback: get all paragraph text if no article container found
    if (content.length < 200) {
      content = $('p')
        .map((_, el) => $(el).text())
        .get()
        .join('\n\n');
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s+\n/g, '\n\n') // Clean up line breaks
      .trim();

    if (content.length < 100) {
      throw new Error('Could not extract sufficient content from the page');
    }

    // Extract metadata
    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('.author').first().text().trim() ||
      undefined;

    const publishDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time').first().attr('datetime') ||
      $('.date').first().text().trim() ||
      undefined;

    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      undefined;

    // Extract tags/keywords
    const keywords =
      $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) ||
      [];

    return {
      title,
      content,
      metadata: {
        author,
        publishDate,
        description,
        tags: keywords,
        url,
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
      },
    };
  } catch (error: any) {
    if (error.message.includes('fetch failed')) {
      throw new Error('Failed to fetch URL. The site may be blocking automated access.');
    }
    throw new Error(`Failed to scrape blog: ${error.message}`);
  }
}

export const blogScraper: Scraper = {
  name: 'blog',
  validate: validateBlogUrl,
  scrape: scrapeBlog,
};
