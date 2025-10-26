/**
 * VTT Parser Module
 * Parses VTT files with sequence number filtering and intro detection
 */

import { VTTSegment, ParsedVTT } from './types';
import { findLectureStart } from './intro-detector';
import { timestampToSeconds, parseTimestampLine, isValidTimestamp } from './timestamp-utils';

/**
 * Checks if a line contains only digits (sequence number)
 * @param line Line to check
 * @returns true if line is only digits
 */
export function isSequenceNumber(line: string): boolean {
  return /^\d+$/.test(line.trim());
}

/**
 * Parses VTT content into structured segments
 * @param content Raw VTT file content
 * @returns Array of VTT segments
 */
export function parseVTT(content: string): VTTSegment[] {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid VTT content: must be a non-empty string');
  }

  const lines = content.split('\n');
  const segments: VTTSegment[] = [];
  let segmentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Skip sequence numbers (lines with only digits)
    if (isSequenceNumber(line)) {
      continue;
    }

    // Skip WEBVTT header
    if (line === 'WEBVTT') {
      continue;
    }

    // Parse timestamp line
    const timestampData = parseTimestampLine(line);
    if (timestampData) {
      const { startTime, endTime } = timestampData;
      
      // Validate timestamps
      if (!isValidTimestamp(startTime) || !isValidTimestamp(endTime)) {
        console.warn(`⚠️  Invalid timestamp format at line ${i + 1}: ${line}`);
        continue;
      }

      // Collect text content (may span multiple lines)
      const textLines: string[] = [];
      i++; // Move to next line after timestamp

      // Collect all text until we hit another timestamp, sequence number, or end of file
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        
        // Stop if we hit another timestamp line
        if (parseTimestampLine(nextLine)) {
          i--; // Back up one line so outer loop can process it
          break;
        }
        
        // Stop if we hit a sequence number
        if (isSequenceNumber(nextLine)) {
          i--; // Back up one line so outer loop can process it
          break;
        }
        
        // Stop if we hit an empty line (end of segment)
        if (!nextLine) {
          break;
        }
        
        // Add non-empty text lines
        if (nextLine) {
          textLines.push(nextLine);
        }
        
        i++;
      }

      // Only create segment if we have text content
      if (textLines.length > 0) {
        const text = textLines.join(' ').trim();
        
        // Skip segments with no meaningful content
        if (text.length > 0) {
          segments.push({
            index: segmentIndex++,
            startTime,
            endTime,
            text
          });
        }
      }
    }
  }

  console.log(`📝 Parsed ${segments.length} VTT segments`);
  return segments;
}

/**
 * Parses VTT content and detects lecture start
 * @param content Raw VTT file content
 * @returns Parsed VTT with lecture start detection
 */
export function parseVTTWithIntroDetection(content: string): ParsedVTT {
  const segments = parseVTT(content);
  
  if (segments.length === 0) {
    return {
      segments: [],
      lectureStartIndex: 0,
      totalDuration: 0
    };
  }

  const lectureStartIndex = findLectureStart(segments);
  const totalDuration = timestampToSeconds(segments[segments.length - 1].endTime);

  console.log(`🎯 Lecture starts at segment ${lectureStartIndex} (${segments[lectureStartIndex]?.startTime || 'N/A'})`);
  console.log(`⏱️  Total duration: ${Math.floor(totalDuration / 60)} minutes`);

  return {
    segments,
    lectureStartIndex,
    totalDuration
  };
}

/**
 * Filters segments to remove intro content
 * @param segments Array of VTT segments
 * @param lectureStartIndex Index where lecture content begins
 * @returns Filtered segments without intro
 */
export function filterIntroSegments(segments: VTTSegment[], lectureStartIndex: number): VTTSegment[] {
  return segments.slice(lectureStartIndex);
}

/**
 * Validates VTT content format
 * @param content VTT content to validate
 * @returns Validation result with errors if any
 */
export function validateVTTContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || typeof content !== 'string') {
    errors.push('Content must be a non-empty string');
    return { isValid: false, errors };
  }

  if (content.length < 10) {
    errors.push('Content too short to be valid VTT');
    return { isValid: false, errors };
  }

  // Check for WEBVTT header
  if (!content.includes('WEBVTT')) {
    errors.push('Missing WEBVTT header');
  }

  // Check for timestamp patterns
  const timestampPattern = /\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;
  if (!timestampPattern.test(content)) {
    errors.push('No valid timestamp patterns found');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
