/**
 * VTT Module - Main exports
 * Centralized exports for VTT parsing functionality
 */

// Main parser functions
export { parseVTT, parseVTTWithIntroDetection, filterIntroSegments, validateVTTContent, isSequenceNumber } from './parser';

// Intro detection
export { findLectureStart, analyzeIntroContent } from './intro-detector';

// Timestamp utilities
export { 
  timestampToSeconds, 
  secondsToTimestamp, 
  calculateDuration, 
  isValidTimestamp, 
  parseTimestampLine 
} from './timestamp-utils';

// Types
export type { VTTSegment, Chunk, ChunkingConfig, ParsedVTT } from './types';
