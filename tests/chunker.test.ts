/**
 * Unit tests for VTT Chunker
 */

import { describe, it, expect } from 'vitest';
import { 
  chunkVTT, 
  validateChunkingConfig, 
  analyzeChunks, 
  DEFAULT_CHUNKING_CONFIG 
} from '../lib/vtt/chunker';
import type { VTTSegment, ChunkingConfig } from '../lib/vtt/types';

describe('VTT Chunker', () => {
  const sampleSegments: VTTSegment[] = [
    {
      index: 0,
      startTime: '00:00:00.000',
      endTime: '00:00:05.000',
      text: 'Welcome to today\'s lecture on Docker containers.'
    },
    {
      index: 1,
      startTime: '00:00:05.000',
      endTime: '00:00:10.000',
      text: 'Docker is a containerization platform that allows you to package applications.'
    },
    {
      index: 2,
      startTime: '00:00:10.000',
      endTime: '00:00:15.000',
      text: 'It provides isolation and consistency across different environments.'
    },
    {
      index: 3,
      startTime: '00:00:15.000',
      endTime: '00:00:20.000',
      text: 'Let\'s start with the basics of containerization and how it works.'
    },
    {
      index: 4,
      startTime: '00:00:20.000',
      endTime: '00:00:25.000',
      text: 'The first step is to install Docker on your system.'
    }
  ];

  describe('chunkVTT', () => {
    it('should create chunks from VTT segments', async () => {
      const chunks = await chunkVTT(sampleSegments);
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('text');
      expect(chunks[0]).toHaveProperty('startTime');
      expect(chunks[0]).toHaveProperty('endTime');
      expect(chunks[0]).toHaveProperty('tokenCount');
      expect(chunks[0]).toHaveProperty('metadata');
    });

    it('should preserve timestamps in chunks', async () => {
      const chunks = await chunkVTT(sampleSegments);
      
      expect(chunks[0].startTime).toBe('00:00:00.000');
      expect(chunks[0].endTime).toBe('00:00:25.000');
    });

    it('should respect token limits', async () => {
      const config: ChunkingConfig = {
        minTokens: 50,
        maxTokens: 100,
        overlap: 10,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const chunks = await chunkVTT(sampleSegments, config);
      
      chunks.forEach(chunk => {
        expect(chunk.tokenCount).toBeLessThanOrEqual(config.maxTokens);
      });
    });

    it('should handle empty segments array', async () => {
      const chunks = await chunkVTT([]);
      expect(chunks).toEqual([]);
    });

    it('should handle single segment', async () => {
      const singleSegment = [sampleSegments[0]];
      const chunks = await chunkVTT(singleSegment);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toContain('Welcome to today\'s lecture');
    });

    it('should create multiple chunks for long content', async () => {
      // Create a long segment that should be split
      const longSegment: VTTSegment = {
        index: 0,
        startTime: '00:00:00.000',
        endTime: '00:00:30.000',
        text: 'This is a very long segment that should be split into multiple chunks because it contains a lot of text that exceeds the maximum token limit and should be properly chunked with overlap to maintain context and ensure that the semantic meaning is preserved across chunk boundaries.'
      };
      
      const config: ChunkingConfig = {
        minTokens: 20,
        maxTokens: 50,
        overlap: 5,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const chunks = await chunkVTT([longSegment], config);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('validateChunkingConfig', () => {
    it('should validate correct configuration', () => {
      const config: ChunkingConfig = {
        minTokens: 100,
        maxTokens: 500,
        overlap: 50,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid minTokens', () => {
      const config: ChunkingConfig = {
        minTokens: 0,
        maxTokens: 500,
        overlap: 50,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('minTokens must be greater than 0');
    });

    it('should reject maxTokens <= minTokens', () => {
      const config: ChunkingConfig = {
        minTokens: 500,
        maxTokens: 100,
        overlap: 50,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxTokens must be greater than minTokens');
    });

    it('should reject negative overlap', () => {
      const config: ChunkingConfig = {
        minTokens: 100,
        maxTokens: 500,
        overlap: -10,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('overlap must be non-negative');
    });

    it('should reject overlap >= minTokens', () => {
      const config: ChunkingConfig = {
        minTokens: 100,
        maxTokens: 500,
        overlap: 150,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('overlap must be less than minTokens');
    });

    it('should reject invalid respectBoundaries', () => {
      const config = {
        minTokens: 100,
        maxTokens: 500,
        overlap: 50,
        respectBoundaries: 'not an array'
      } as any;
      
      const result = validateChunkingConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('respectBoundaries must be an array');
    });
  });

  describe('analyzeChunks', () => {
    it('should analyze chunk statistics', async () => {
      const chunks = await chunkVTT(sampleSegments);
      const analysis = analyzeChunks(chunks);
      
      expect(analysis.totalChunks).toBeGreaterThan(0);
      expect(analysis.averageTokens).toBeGreaterThan(0);
      expect(analysis.minTokens).toBeGreaterThan(0);
      expect(analysis.maxTokens).toBeGreaterThan(0);
      expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should handle empty chunks array', () => {
      const analysis = analyzeChunks([]);
      
      expect(analysis.totalChunks).toBe(0);
      expect(analysis.averageTokens).toBe(0);
      expect(analysis.minTokens).toBe(0);
      expect(analysis.maxTokens).toBe(0);
      expect(analysis.chunksWithOverlap).toBe(0);
      expect(analysis.qualityScore).toBe(0);
    });

    it('should calculate quality score correctly', async () => {
      const config: ChunkingConfig = {
        minTokens: 50,
        maxTokens: 100,
        overlap: 10,
        respectBoundaries: ['. ', '! ', '? ']
      };
      
      const chunks = await chunkVTT(sampleSegments, config);
      const analysis = analyzeChunks(chunks);
      
      expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.qualityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_CHUNKING_CONFIG', () => {
    it('should have valid default configuration', () => {
      const result = validateChunkingConfig(DEFAULT_CHUNKING_CONFIG);
      expect(result.isValid).toBe(true);
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_CHUNKING_CONFIG.minTokens).toBe(300);
      expect(DEFAULT_CHUNKING_CONFIG.maxTokens).toBe(800);
      expect(DEFAULT_CHUNKING_CONFIG.overlap).toBe(50);
      expect(DEFAULT_CHUNKING_CONFIG.respectBoundaries).toEqual(['\n\n', '. ', '? ', '! ']);
    });
  });

  describe('Chunk metadata', () => {
    it('should include proper metadata in chunks', async () => {
      const chunks = await chunkVTT(sampleSegments);
      
      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index);
        expect(typeof chunk.metadata.hasOverlap).toBe('boolean');
        
        if (index > 0) {
          expect(chunk.metadata.hasOverlap).toBe(true);
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle segments with empty text', async () => {
      const segmentsWithEmpty: VTTSegment[] = [
        {
          index: 0,
          startTime: '00:00:00.000',
          endTime: '00:00:05.000',
          text: 'Valid content'
        },
        {
          index: 1,
          startTime: '00:00:05.000',
          endTime: '00:00:10.000',
          text: ''
        },
        {
          index: 2,
          startTime: '00:00:10.000',
          endTime: '00:00:15.000',
          text: 'More valid content'
        }
      ];
      
      const chunks = await chunkVTT(segmentsWithEmpty);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain('Valid content');
    });

    it('should handle very short segments', async () => {
      const shortSegments: VTTSegment[] = [
        {
          index: 0,
          startTime: '00:00:00.000',
          endTime: '00:00:01.000',
          text: 'Hi'
        }
      ];
      
      const chunks = await chunkVTT(shortSegments);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe('Hi');
    });
  });
});
