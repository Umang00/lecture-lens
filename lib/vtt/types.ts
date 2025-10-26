/**
 * VTT Parser Types
 * Defines interfaces for VTT parsing and processing
 */

export interface VTTSegment {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
  speaker?: string;
}

export interface Chunk {
  text: string;
  startTime: string;
  endTime: string;
  tokenCount: number;
  metadata: {
    chunkIndex: number;
    hasOverlap: boolean;
  };
}

export interface ChunkingConfig {
  minTokens: number;
  maxTokens: number;
  overlap: number;
  respectBoundaries: string[];
}

export interface ParsedVTT {
  segments: VTTSegment[];
  lectureStartIndex: number;
  totalDuration: number;
}
