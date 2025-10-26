/**
 * Semantic Chunking Module
 * Chunks VTT segments with overlap and boundary respect
 */

import { VTTSegment, Chunk, ChunkingConfig } from './types';
import { estimateTokenCount, isWithinTokenLimit, truncateToTokenLimit } from './token-counter';

/**
 * Default chunking configuration
 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  minTokens: 300,
  maxTokens: 800,
  overlap: 50,
  respectBoundaries: ['\n\n', '. ', '? ', '! ']
};

/**
 * Chunks VTT segments into semantic chunks with overlap
 * @param segments Array of VTT segments
 * @param config Chunking configuration
 * @returns Array of chunks
 */
export async function chunkVTT(
  segments: VTTSegment[],
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): Promise<Chunk[]> {
  if (segments.length === 0) {
    return [];
  }

  console.log(`📦 Chunking ${segments.length} VTT segments...`);
  
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentStartTime = segments[0].startTime;
  let currentEndTime = segments[0].endTime;
  let chunkIndex = 0;
  let segmentIndex = 0;

  // Process segments sequentially
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentText = segment.text.trim();
    
    if (!segmentText) {
      continue; // Skip empty segments
    }

    // Test if adding this segment would exceed max tokens
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + segmentText;
    const testTokens = estimateTokenCount(testChunk);

    if (testTokens > config.maxTokens && currentChunk) {
      // Current chunk is full, finalize it
      const chunk = createChunk(
        currentChunk,
        currentStartTime,
        currentEndTime,
        chunkIndex,
        config
      );
      chunks.push(chunk);
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, config.overlap);
      currentChunk = overlapText + (overlapText ? ' ' : '') + segmentText;
      currentStartTime = segment.startTime;
      currentEndTime = segment.endTime;
      chunkIndex++;
    } else if (testTokens > config.maxTokens && !currentChunk) {
      // Single segment is too long, split it
      const splitChunks = splitLongSegment(segment, config, chunkIndex);
      chunks.push(...splitChunks);
      chunkIndex += splitChunks.length;
      currentChunk = '';
    } else {
      // Add segment to current chunk
      currentChunk = testChunk;
      currentEndTime = segment.endTime;
    }
    
    segmentIndex++;
  }

  // Add final chunk if it has content
  if (currentChunk.trim()) {
    const chunk = createChunk(
      currentChunk,
      currentStartTime,
      currentEndTime,
      chunkIndex,
      config
    );
    chunks.push(chunk);
  }

  console.log(`✅ Created ${chunks.length} chunks from ${segments.length} segments`);
  return chunks;
}

/**
 * Creates a chunk with proper metadata
 */
function createChunk(
  text: string,
  startTime: string,
  endTime: string,
  chunkIndex: number,
  config: ChunkingConfig
): Chunk {
  const tokenCount = estimateTokenCount(text);
  
  // Ensure chunk meets minimum token requirement
  let finalText = text;
  if (tokenCount < config.minTokens) {
    console.warn(`⚠️  Chunk ${chunkIndex} has only ${tokenCount} tokens (min: ${config.minTokens})`);
  }
  
  // Ensure chunk doesn't exceed maximum token limit
  if (tokenCount > config.maxTokens) {
    console.warn(`⚠️  Chunk ${chunkIndex} has ${tokenCount} tokens (max: ${config.maxTokens}), truncating`);
    finalText = truncateToTokenLimit(text, config.maxTokens);
  }

  return {
    text: finalText.trim(),
    startTime,
    endTime,
    tokenCount: estimateTokenCount(finalText),
    metadata: {
      chunkIndex,
      hasOverlap: chunkIndex > 0
    }
  };
}

/**
 * Splits a long segment into multiple chunks
 */
function splitLongSegment(
  segment: VTTSegment, 
  config: ChunkingConfig, 
  startChunkIndex: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const words = segment.text.split(/\s+/);
  let currentChunk = '';
  let chunkIndex = startChunkIndex;
  
  for (const word of words) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
    const testTokens = estimateTokenCount(testChunk);
    
    if (testTokens > config.maxTokens && currentChunk) {
      // Current chunk is full, create it
      const chunk = createChunk(
        currentChunk,
        segment.startTime,
        segment.endTime,
        chunkIndex,
        config
      );
      chunks.push(chunk);
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, config.overlap);
      currentChunk = overlapText + (overlapText ? ' ' : '') + word;
      chunkIndex++;
    } else {
      currentChunk = testChunk;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.trim()) {
    const chunk = createChunk(
      currentChunk,
      segment.startTime,
      segment.endTime,
      chunkIndex,
      config
    );
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Gets overlap text from the end of previous chunk
 */
function getOverlapText(text: string, overlapTokens: number): string {
  if (overlapTokens <= 0) {
    return '';
  }

  const words = text.split(/\s+/);
  const overlapWords: string[] = [];
  let currentTokens = 0;

  // Work backwards from the end to get overlap
  for (let i = words.length - 1; i >= 0 && currentTokens < overlapTokens; i--) {
    const word = words[i];
    const wordTokens = estimateTokenCount(word);
    
    if (currentTokens + wordTokens <= overlapTokens) {
      overlapWords.unshift(word);
      currentTokens += wordTokens;
    } else {
      break;
    }
  }

  return overlapWords.join(' ');
}

/**
 * Validates chunking configuration
 */
export function validateChunkingConfig(config: ChunkingConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.minTokens <= 0) {
    errors.push('minTokens must be greater than 0');
  }

  if (config.maxTokens <= config.minTokens) {
    errors.push('maxTokens must be greater than minTokens');
  }

  if (config.overlap < 0) {
    errors.push('overlap must be non-negative');
  }

  if (config.overlap >= config.minTokens) {
    errors.push('overlap must be less than minTokens');
  }

  if (!Array.isArray(config.respectBoundaries)) {
    errors.push('respectBoundaries must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Analyzes chunk quality and provides statistics
 */
export function analyzeChunks(chunks: Chunk[]): {
  totalChunks: number;
  averageTokens: number;
  minTokens: number;
  maxTokens: number;
  chunksWithOverlap: number;
  qualityScore: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      averageTokens: 0,
      minTokens: 0,
      maxTokens: 0,
      chunksWithOverlap: 0,
      qualityScore: 0
    };
  }

  const tokenCounts = chunks.map(chunk => chunk.tokenCount);
  const averageTokens = tokenCounts.reduce((sum, count) => sum + count, 0) / chunks.length;
  const minTokens = Math.min(...tokenCounts);
  const maxTokens = Math.max(...tokenCounts);
  const chunksWithOverlap = chunks.filter(chunk => chunk.metadata.hasOverlap).length;

  // Quality score based on consistency and overlap
  const tokenVariance = tokenCounts.reduce((sum, count) => sum + Math.pow(count - averageTokens, 2), 0) / chunks.length;
  const consistencyScore = Math.max(0, 1 - (tokenVariance / (averageTokens * averageTokens)));
  const overlapScore = chunksWithOverlap / chunks.length;
  const qualityScore = (consistencyScore + overlapScore) / 2;

  return {
    totalChunks: chunks.length,
    averageTokens: Math.round(averageTokens),
    minTokens,
    maxTokens,
    chunksWithOverlap,
    qualityScore: Math.round(qualityScore * 100) / 100
  };
}
