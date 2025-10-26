/**
 * YouTube video transcript scraper
 */

import { YoutubeTranscript } from 'youtube-transcript';
import type { Scraper, ScrapedContent } from './types';
import { validateYouTubeUrl } from './validators';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Scrape YouTube video transcript
 */
async function scrapeYouTube(url: string): Promise<ScrapedContent> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL: Could not extract video ID');
  }

  try {
    // Fetch transcript using youtube-transcript library
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    // Combine transcript text
    const content = transcript.map(item => item.text).join(' ');

    if (!content || content.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Try to fetch video metadata (title, channel) from YouTube API or oEmbed
    let title = `YouTube Video ${videoId}`;
    let channelName = 'Unknown';

    try {
      // Use oEmbed API (no API key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);

      if (response.ok) {
        const data = await response.json();
        title = data.title || title;
        channelName = data.author_name || channelName;
      }
    } catch (metadataError) {
      console.warn(`Could not fetch metadata for video ${videoId}:`, metadataError);
      // Continue with transcript even if metadata fails
    }

    return {
      title,
      content,
      metadata: {
        videoId,
        channelName,
        duration: formatDuration(transcript),
        transcriptLength: transcript.length,
        contentLength: content.length,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    if (error.message.includes('Transcript is disabled')) {
      throw new Error('Transcript is disabled for this video');
    }
    if (error.message.includes('Video unavailable')) {
      throw new Error('Video is unavailable or private');
    }
    throw new Error(`Failed to scrape YouTube video: ${error.message}`);
  }
}

/**
 * Calculate approximate duration from transcript
 */
function formatDuration(transcript: Array<{ offset: number; duration: number }>): string {
  if (transcript.length === 0) return '0:00';

  const lastItem = transcript[transcript.length - 1];
  const totalSeconds = Math.floor((lastItem.offset + lastItem.duration) / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export const youtubeScraper: Scraper = {
  name: 'youtube',
  validate: validateYouTubeUrl,
  scrape: scrapeYouTube,
};
