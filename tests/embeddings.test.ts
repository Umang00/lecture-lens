/**
 * Unit tests for Embedding Generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateEmbeddings,
  generateEmbeddingsBatch,
  generateSingleEmbedding,
  validateEmbedding,
  validateEmbeddings,
  getEmbeddingStats
} from '../lib/ai/embeddings';
import type { Chunk } from '../lib/vtt/types';

// Mock the OpenRouter client
const mockClient = {
  embeddings: {
    create: vi.fn()
  }
};

vi.mock('../lib/ai/openrouter', () => ({
  createOpenRouterClient: vi.fn(() => mockClient),
  getEmbeddingModel: vi.fn(() => 'text-embedding-3-small'),
  OPENROUTER_CONFIG: {
    BATCH_SIZE: 10,
    BATCH_DELAY_MS: 100,
    EMBEDDING_DIMENSIONS: 1536
  }
}));

describe('Embedding Generation', () => {
  const mockEmbedding = Array(1536).fill(0).map(() => Math.random() - 0.5);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    mockClient.embeddings.create.mockResolvedValue({
      data: [
        { embedding: mockEmbedding },
        { embedding: mockEmbedding }
      ]
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['Hello world', 'Test embedding'];
      const embeddings = await generateEmbeddings(texts);
      
      expect(embeddings).toHaveLength(2);
      expect(embeddings[0]).toHaveLength(1536);
      expect(embeddings[1]).toHaveLength(1536);
    });

    it('should handle empty text array', async () => {
      const embeddings = await generateEmbeddings([]);
      expect(embeddings).toEqual([]);
    });

    it('should call progress callback', async () => {
      const texts = ['Text 1', 'Text 2'];
      const progressCallback = vi.fn();
      
      await generateEmbeddings(texts, 1, progressCallback);
      
      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    it('should handle API errors', async () => {
      mockClient.embeddings.create.mockRejectedValue(new Error('API Error'));
      
      await expect(generateEmbeddings(['test'])).rejects.toThrow('Failed to generate embeddings');
    });
  });

  describe('generateEmbeddingsBatch', () => {
    const sampleChunks: Chunk[] = [
      {
        text: 'First chunk content',
        startTime: '00:00:00.000',
        endTime: '00:00:05.000',
        tokenCount: 10,
        metadata: { chunkIndex: 0, hasOverlap: false }
      },
      {
        text: 'Second chunk content',
        startTime: '00:00:05.000',
        endTime: '00:00:10.000',
        tokenCount: 10,
        metadata: { chunkIndex: 1, hasOverlap: true }
      }
    ];

    it('should generate embeddings for chunks', async () => {
      const results = await generateEmbeddingsBatch(sampleChunks);
      
      expect(results).toHaveLength(2);
      expect(results[0].chunk).toEqual(sampleChunks[0]);
      expect(results[0].embedding).toHaveLength(1536);
      expect(results[1].chunk).toEqual(sampleChunks[1]);
      expect(results[1].embedding).toHaveLength(1536);
    });

    it('should handle empty chunks array', async () => {
      const results = await generateEmbeddingsBatch([]);
      expect(results).toEqual([]);
    });

    it('should call progress callback', async () => {
      const progressCallback = vi.fn();
      
      await generateEmbeddingsBatch(sampleChunks, progressCallback);
      
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('generateSingleEmbedding', () => {
    it('should generate embedding for single text', async () => {
      const embedding = await generateSingleEmbedding('Test text');
      
      expect(embedding).toHaveLength(1536);
      expect(Array.isArray(embedding)).toBe(true);
    });
  });

  describe('validateEmbedding', () => {
    it('should validate correct embedding', () => {
      const validEmbedding = Array(1536).fill(0.5);
      expect(validateEmbedding(validEmbedding)).toBe(true);
    });

    it('should reject embedding with wrong dimensions', () => {
      const invalidEmbedding = Array(100).fill(0.5);
      expect(validateEmbedding(invalidEmbedding)).toBe(false);
    });

    it('should reject non-array input', () => {
      expect(validateEmbedding('not an array' as any)).toBe(false);
    });

    it('should reject embedding with NaN values', () => {
      const invalidEmbedding = Array(1536).fill(NaN);
      expect(validateEmbedding(invalidEmbedding)).toBe(false);
    });
  });

  describe('validateEmbeddings', () => {
    it('should validate multiple correct embeddings', () => {
      const embeddings = [
        Array(1536).fill(0.1),
        Array(1536).fill(0.2),
        Array(1536).fill(0.3)
      ];
      expect(validateEmbeddings(embeddings)).toBe(true);
    });

    it('should reject if any embedding is invalid', () => {
      const embeddings = [
        Array(1536).fill(0.1),
        Array(100).fill(0.2), // Wrong dimensions
        Array(1536).fill(0.3)
      ];
      expect(validateEmbeddings(embeddings)).toBe(false);
    });
  });

  describe('getEmbeddingStats', () => {
    it('should calculate embedding statistics', () => {
      const embeddings = [
        [1, 0, 0], // Magnitude = 1
        [0, 1, 0], // Magnitude = 1
        [0, 0, 1]  // Magnitude = 1
      ];
      
      const stats = getEmbeddingStats(embeddings);
      
      expect(stats.count).toBe(3);
      expect(stats.dimensions).toBe(3);
      expect(stats.averageMagnitude).toBe(1);
      expect(stats.minMagnitude).toBe(1);
      expect(stats.maxMagnitude).toBe(1);
    });

    it('should handle empty embeddings array', () => {
      const stats = getEmbeddingStats([]);
      
      expect(stats.count).toBe(0);
      expect(stats.dimensions).toBe(0);
      expect(stats.averageMagnitude).toBe(0);
      expect(stats.minMagnitude).toBe(0);
      expect(stats.maxMagnitude).toBe(0);
    });

    it('should calculate magnitude correctly', () => {
      const embeddings = [
        [3, 4], // Magnitude = 5
        [0, 0]  // Magnitude = 0
      ];
      
      const stats = getEmbeddingStats(embeddings);
      
      expect(stats.averageMagnitude).toBe(2.5);
      expect(stats.minMagnitude).toBe(0);
      expect(stats.maxMagnitude).toBe(5);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockClient.embeddings.create.mockRejectedValue(new Error('Network error'));
      
      await expect(generateEmbeddings(['test'])).rejects.toThrow();
    });

    it('should handle invalid API responses', async () => {
      mockClient.embeddings.create.mockResolvedValue({
        data: [{ embedding: 'invalid' }] // Not an array
      });
      
      // The function should still work but with invalid embeddings
      const embeddings = await generateEmbeddings(['test']);
      expect(embeddings).toHaveLength(1);
      expect(embeddings[0]).toBe('invalid');
    });
  });
});
