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

// Chunking functionality
export { 
  chunkVTT, 
  validateChunkingConfig, 
  analyzeChunks, 
  DEFAULT_CHUNKING_CONFIG 
} from './chunker';

// Token counting utilities
export {
  estimateTokenCount,
  isWithinTokenLimit,
  truncateToTokenLimit,
  countTokensInText
} from './token-counter';

// VTT processing pipeline
export { processVTTFile } from './processor';

// Types
export type { VTTSegment, Chunk, ChunkingConfig, ParsedVTT } from './types';
