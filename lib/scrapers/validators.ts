/**
 * URL validators for different resource types
 */

import type { ResourceType } from './types';

export function validateGitHubUrl(url: string): boolean {
  // Matches: https://github.com/owner/repo or github.com/owner/repo
  const pattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/i;
  return pattern.test(url);
}

export function validateYouTubeUrl(url: string): boolean {
  // Matches: youtube.com/watch?v=... or youtu.be/...
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/i,
  ];
  return patterns.some(pattern => pattern.test(url));
}

export function validateBlogUrl(url: string): boolean {
  // Basic URL validation for blogs
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateRssUrl(url: string): boolean {
  // RSS feeds typically end with .xml or .rss
  try {
    const parsed = new URL(url);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      (url.endsWith('.xml') || url.endsWith('.rss') || url.includes('/feed'))
    );
  } catch {
    return false;
  }
}

/**
 * Validates URL for a given resource type
 */
export function validateResourceUrl(url: string, type: ResourceType): boolean {
  switch (type) {
    case 'github':
      return validateGitHubUrl(url);
    case 'youtube':
      return validateYouTubeUrl(url);
    case 'blog':
      return validateBlogUrl(url);
    case 'rss':
      return validateRssUrl(url);
    case 'other':
      return validateBlogUrl(url); // Use generic URL validation
    default:
      return false;
  }
}

/**
 * Detects resource type from URL (optional helper - frontend should always provide type)
 * @deprecated Use explicit type selection on frontend instead
 */
export function detectResourceType(url: string): ResourceType {
  if (validateGitHubUrl(url)) return 'github';
  if (validateYouTubeUrl(url)) return 'youtube';
  if (validateRssUrl(url)) return 'rss';
  return 'blog'; // Default to blog for generic URLs
}

/**
 * Get user-friendly placeholder text for resource type
 */
export function getPlaceholderForType(type: ResourceType): string {
  switch (type) {
    case 'github':
      return 'https://github.com/username/repo';
    case 'youtube':
      return 'https://youtube.com/watch?v=...';
    case 'blog':
      return 'https://example.com/article';
    case 'rss':
      return 'https://example.com/feed.xml';
    case 'other':
      return 'https://example.com';
    default:
      return 'Enter URL';
  }
}
