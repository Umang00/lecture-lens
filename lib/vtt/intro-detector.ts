/**
 * Intro Detection for VTT Processing
 * Detects lecture start by analyzing content and timestamps
 */

import { VTTSegment } from './types';
import { timestampToSeconds } from './timestamp-utils';

/**
 * Keywords that indicate the start of actual lecture content
 */
const LECTURE_START_KEYWORDS = [
  'today',
  'we\'ll cover',
  'let\'s start',
  'agenda',
  'welcome to',
  'in this lecture',
  'we will learn',
  'our topic today',
  'let\'s begin',
  'first',
  'introduction'
];

/**
 * Finds the start of lecture content by analyzing segments
 * Uses keyword detection first, then falls back to 10-minute skip
 * 
 * @param segments Array of VTT segments
 * @returns Index of first substantive segment
 */
export function findLectureStart(segments: VTTSegment[]): number {
  if (segments.length === 0) {
    return 0;
  }

  // Strategy 1: Keyword detection in first 20 segments
  for (let i = 0; i < Math.min(segments.length, 20); i++) {
    const segment = segments[i];
    const text = segment.text.toLowerCase();
    
    // Check if segment has substantial content and contains lecture keywords
    if (text.length > 20 && containsLectureKeywords(text)) {
      console.log(`🎯 Found lecture start at segment ${i} (${segment.startTime}): "${segment.text.substring(0, 100)}..."`);
      return i;
    }
  }

  // Strategy 2: Skip first 10 minutes (fallback)
  const tenMinutes = 10 * 60; // 600 seconds
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const timeInSeconds = timestampToSeconds(segment.startTime);
    
    // Find first segment after 10 minutes with substantial content
    if (timeInSeconds > tenMinutes && segment.text.length > 50) {
      console.log(`⏰ Using 10-minute fallback: lecture starts at segment ${i} (${segment.startTime})`);
      return i;
    }
  }

  // Fallback: return 0 if no clear start found
  console.log('⚠️  No clear lecture start detected, using first segment');
  return 0;
}

/**
 * Checks if text contains lecture start keywords
 * @param text Text to analyze
 * @returns true if contains lecture keywords
 */
function containsLectureKeywords(text: string): boolean {
  return LECTURE_START_KEYWORDS.some(keyword => 
    text.includes(keyword)
  );
}

/**
 * Analyzes segments to determine if they contain intro content
 * @param segments Array of segments to analyze
 * @returns Object with analysis results
 */
export function analyzeIntroContent(segments: VTTSegment[]): {
  hasIntro: boolean;
  introDuration: number;
  lectureStartIndex: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const lectureStartIndex = findLectureStart(segments);
  
  if (lectureStartIndex === 0) {
    return {
      hasIntro: false,
      introDuration: 0,
      lectureStartIndex: 0,
      confidence: 'low'
    };
  }

  const introDuration = timestampToSeconds(segments[lectureStartIndex].startTime);
  
  // Determine confidence based on detection method
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (lectureStartIndex < 20) {
    // Found via keyword detection
    confidence = 'high';
  } else if (introDuration < 15 * 60) {
    // Found within 15 minutes
    confidence = 'medium';
  }

  return {
    hasIntro: true,
    introDuration,
    lectureStartIndex,
    confidence
  };
}
