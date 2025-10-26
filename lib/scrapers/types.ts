/**
 * Base types for resource scraping
 */

export type ResourceType = 'github' | 'youtube' | 'blog' | 'rss' | 'other';

export interface ScrapedContent {
  title: string;
  content: string;
  metadata: Record<string, any>;
}

export interface Scraper {
  name: string;
  validate: (url: string) => boolean;
  scrape: (url: string) => Promise<ScrapedContent>;
}

export interface ScrapingResult {
  success: boolean;
  content?: ScrapedContent;
  error?: string;
}

export interface ResourceMetadata {
  // GitHub
  owner?: string;
  repo?: string;
  stars?: number;
  language?: string;
  topics?: string[];

  // YouTube
  channelName?: string;
  duration?: string;
  viewCount?: number;
  videoId?: string;

  // Blog
  author?: string;
  publishDate?: string;
  tags?: string[];

  // Common
  scrapedAt: string;
  contentLength: number;
}
