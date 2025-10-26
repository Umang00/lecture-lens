/**
 * RAG Module Tests
 * Tests for the RAG (Retrieval-Augmented Generation) functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rerankResults, getRankingStats } from '../lib/rag/reranker';
import type { SearchResult, RerankedResult } from '../lib/rag/reranker';

// Mock data for testing
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'lecture',
    text: 'Docker is a containerization platform that allows you to package applications with their dependencies.',
    similarity: 0.8,
    metadata: {
      lectureTitle: 'Docker Deep Dive',
      instructor: 'Siddhanth',
      timestamp: '00:15:30',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }
  },
  {
    id: '2',
    type: 'resource',
    text: 'Docker Compose is a tool for defining and running multi-container Docker applications.',
    similarity: 0.75,
    metadata: {
      resourceTitle: 'Docker Compose Tutorial',
      type: 'github',
      url: 'https://github.com/docker/compose',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    }
  },
  {
    id: '3',
    type: 'lecture',
    text: 'function createContainer() { return new Docker(); }',
    similarity: 0.7,
    metadata: {
      lectureTitle: 'JavaScript and Docker',
      instructor: 'John',
      timestamp: '00:45:00',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
    }
  }
];

describe('RAG Reranker', () => {
  describe('rerankResults', () => {
    it('should rerank results with hybrid scoring', () => {
      const query = 'Docker containerization';
      const reranked = rerankResults(mockSearchResults, query);
      
      expect(reranked).toHaveLength(3);
      expect(reranked[0].finalScore).toBeGreaterThan(reranked[1].finalScore);
      expect(reranked[1].finalScore).toBeGreaterThan(reranked[2].finalScore);
    });

    it('should boost recent content', () => {
      const query = 'Docker';
      const reranked = rerankResults(mockSearchResults, query);
      
      // Most recent content (7 days ago) should be ranked higher
      const mostRecent = reranked.find(r => r.id === '1');
      expect(mostRecent?.rankingFactors.recencyBoost).toBeGreaterThan(0);
    });

    it('should boost title matches', () => {
      const query = 'Docker Deep Dive';
      const reranked = rerankResults(mockSearchResults, query);
      
      // Content with matching title should be ranked higher
      const titleMatch = reranked.find(r => r.metadata.lectureTitle === 'Docker Deep Dive');
      expect(titleMatch?.rankingFactors.titleRelevance).toBeGreaterThan(0);
    });

    it('should boost code content for technical queries', () => {
      const query = 'JavaScript function code';
      const reranked = rerankResults(mockSearchResults, query);
      
      // Content with code should be boosted for technical queries
      const codeContent = reranked.find(r => r.text.includes('function'));
      expect(codeContent?.rankingFactors.codePresence).toBeGreaterThan(0);
    });

    it('should boost resource type relevance', () => {
      const query = 'GitHub repository tutorial';
      const reranked = rerankResults(mockSearchResults, query);
      
      // GitHub resource should be boosted for GitHub-related queries
      const githubResource = reranked.find(r => r.metadata.type === 'github');
      expect(githubResource?.rankingFactors.resourceTypeRelevance).toBeGreaterThan(0);
    });

    it('should handle empty results', () => {
      const reranked = rerankResults([], 'test query');
      expect(reranked).toHaveLength(0);
    });

    it('should preserve original data', () => {
      const query = 'Docker';
      const reranked = rerankResults(mockSearchResults, query);
      
      reranked.forEach(result => {
        expect(result.id).toBeDefined();
        expect(result.type).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.similarity).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.finalScore).toBeDefined();
        expect(result.rankingFactors).toBeDefined();
      });
    });
  });

  describe('getRankingStats', () => {
    it('should calculate ranking statistics', () => {
      const query = 'Docker';
      const reranked = rerankResults(mockSearchResults, query);
      const stats = getRankingStats(reranked);
      
      expect(stats.averageScore).toBeGreaterThan(0);
      expect(stats.scoreRange[0]).toBeLessThanOrEqual(stats.scoreRange[1]);
      expect(stats.topFactors).toHaveLength(3);
    });

    it('should handle empty results', () => {
      const stats = getRankingStats([]);
      
      expect(stats.averageScore).toBe(0);
      expect(stats.scoreRange).toEqual([0, 0]);
      expect(stats.topFactors).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle results with missing metadata', () => {
      const resultsWithMissingMetadata: SearchResult[] = [
        {
          id: '1',
          type: 'lecture',
          text: 'Test content',
          similarity: 0.8,
          metadata: {}
        }
      ];
      
      const reranked = rerankResults(resultsWithMissingMetadata, 'test');
      expect(reranked).toHaveLength(1);
      expect(reranked[0].finalScore).toBeGreaterThan(0);
    });

    it('should handle very short queries', () => {
      const reranked = rerankResults(mockSearchResults, 'a');
      expect(reranked).toHaveLength(3);
    });

    it('should handle queries with special characters', () => {
      const reranked = rerankResults(mockSearchResults, 'Docker & Kubernetes!');
      expect(reranked).toHaveLength(3);
    });
  });
});
