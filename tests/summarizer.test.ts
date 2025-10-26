/**
 * Unit tests for Lecture Summary Generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateLectureSummary,
  DEFAULT_SUMMARY_CONFIG
} from '../lib/ai/summarizer';
import type { Chunk } from '../lib/vtt/types';
import type { LectureSummary, SummaryConfig } from '../lib/ai/summarizer-types';

// Mock the OpenRouter client
const mockClient = {
  chat: {
    completions: {
      create: vi.fn()
    }
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

describe('Lecture Summary Generation', () => {
  const sampleChunks: Chunk[] = [
    {
      text: 'Welcome to today\'s lecture on Docker containers. We\'ll cover the basics of containerization and how to use Docker effectively.',
      startTime: '00:00:00.000',
      endTime: '00:05:00.000',
      tokenCount: 25,
      metadata: { chunkIndex: 0, hasOverlap: false }
    },
    {
      text: 'Docker is a containerization platform that allows you to package applications with their dependencies. It provides isolation and consistency across different environments.',
      startTime: '00:05:00.000',
      endTime: '00:10:00.000',
      tokenCount: 30,
      metadata: { chunkIndex: 1, hasOverlap: true }
    },
    {
      text: 'Let\'s start with installing Docker. First, download Docker Desktop from docker.com. Then we\'ll create our first container using the hello-world image.',
      startTime: '00:10:00.000',
      endTime: '00:15:00.000',
      tokenCount: 35,
      metadata: { chunkIndex: 2, hasOverlap: true }
    }
  ];

  const mockSummaryResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          sections: [
            {
              title: 'Introduction to Docker',
              timestampStart: '00:00:00',
              timestampEnd: '00:05:00',
              durationMins: 5,
              keyConcepts: [
                {
                  concept: 'Containerization',
                  timestamp: '00:02:00',
                  explanation: 'Packaging applications with dependencies',
                  importance: 'high'
                }
              ],
              technicalDetails: ['Docker platform', 'Application packaging'],
              demonstrations: [],
              summary: 'Introduction to Docker concepts'
            }
          ]
        })
      }
    }]
  };

  const mockToolsResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          tools: [
            {
              name: 'Docker Desktop',
              category: 'tool',
              firstMentioned: '00:10:00',
              description: 'Docker GUI application',
              useCases: ['Local development', 'Container management'],
              alternatives: ['Docker CLI']
            }
          ]
        })
      }
    }]
  };

  const mockResourcesResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          resources: [
            'Docker documentation',
            'Docker Hub repository',
            'Docker tutorials'
          ]
        })
      }
    }]
  };

  const mockTakeawaysResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          takeaways: [
            'Docker provides application isolation (00:05:00)',
            'Use Docker Desktop for local development (00:10:00)',
            'Containerization improves deployment consistency'
          ]
        })
      }
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to set up successful mocks
  function setupSuccessfulMocks() {
    mockClient.chat.completions.create
      .mockResolvedValueOnce(mockSummaryResponse) // Executive overview
      .mockResolvedValueOnce(mockSummaryResponse) // Sections
      .mockResolvedValueOnce(mockToolsResponse)   // Tools
      .mockResolvedValueOnce(mockResourcesResponse) // Resources
      .mockResolvedValueOnce(mockTakeawaysResponse); // Takeaways
  }

  describe('generateLectureSummary', () => {
    it('should generate comprehensive lecture summary', async () => {
      setupSuccessfulMocks();
      const result = await generateLectureSummary(sampleChunks);
      
      expect(result.summary).toBeDefined();
      expect(result.summary.executiveOverview).toBeTruthy();
      expect(result.summary.sections).toBeInstanceOf(Array);
      expect(result.summary.toolsMentioned).toBeInstanceOf(Array);
      expect(result.summary.keyTakeaways).toBeInstanceOf(Array);
      expect(result.summary.resourcesShared).toBeInstanceOf(Array);
      expect(result.summary.totalDuration).toBeGreaterThan(0);
    });

    it('should include processing metadata', async () => {
      setupSuccessfulMocks();
      const result = await generateLectureSummary(sampleChunks);
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.chunksProcessed).toBe(sampleChunks.length);
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should call progress callback', async () => {
      setupSuccessfulMocks();
      const progressCallback = vi.fn();
      
      await generateLectureSummary(sampleChunks, DEFAULT_SUMMARY_CONFIG, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
    });

    it('should handle empty chunks array', async () => {
      await expect(generateLectureSummary([])).rejects.toThrow('No chunks provided');
    });

    it('should use custom configuration', async () => {
      setupSuccessfulMocks();
      const customConfig: SummaryConfig = {
        maxSections: 5,
        minSectionDuration: 10,
        includeTechnicalDetails: false,
        includeDemonstrations: false,
        includeResources: false,
        summaryStyle: 'concise'
      };
      
      const result = await generateLectureSummary(sampleChunks, customConfig);
      
      expect(result.summary).toBeDefined();
      expect(result.summary.sections.length).toBeLessThanOrEqual(5);
    });

    it('should handle API errors gracefully', async () => {
      // Reset mocks and set up error scenario
      vi.clearAllMocks();
      mockClient.chat.completions.create.mockRejectedValue(new Error('API Error'));
      
      await expect(generateLectureSummary(sampleChunks)).rejects.toThrow('API Error');
    });

    it('should handle malformed JSON responses', async () => {
      // Reset mocks and set up malformed JSON scenario
      vi.clearAllMocks();
      mockClient.chat.completions.create
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Executive overview' } }] }) // Overview
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Invalid JSON' } }] }) // Sections
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Invalid JSON' } }] }) // Tools
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Invalid JSON' } }] }) // Resources
        .mockResolvedValueOnce({ choices: [{ message: { content: 'Invalid JSON' } }] }); // Takeaways
      
      const result = await generateLectureSummary(sampleChunks);
      
      // Should still return a summary with empty arrays for failed parsing
      expect(result.summary.sections).toEqual([]);
      expect(result.summary.toolsMentioned).toEqual([]);
      expect(result.summary.keyTakeaways).toEqual([]);
      expect(result.summary.resourcesShared).toEqual([]);
    });
  });

  describe('DEFAULT_SUMMARY_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_SUMMARY_CONFIG.maxSections).toBe(10);
      expect(DEFAULT_SUMMARY_CONFIG.minSectionDuration).toBe(5);
      expect(DEFAULT_SUMMARY_CONFIG.includeTechnicalDetails).toBe(true);
      expect(DEFAULT_SUMMARY_CONFIG.includeDemonstrations).toBe(true);
      expect(DEFAULT_SUMMARY_CONFIG.includeResources).toBe(true);
      expect(DEFAULT_SUMMARY_CONFIG.summaryStyle).toBe('comprehensive');
    });
  });

  describe('Summary structure validation', () => {
    it('should generate valid summary structure', async () => {
      setupSuccessfulMocks();
      const result = await generateLectureSummary(sampleChunks);
      const summary = result.summary;
      
      // Validate required fields
      expect(typeof summary.executiveOverview).toBe('string');
      expect(Array.isArray(summary.sections)).toBe(true);
      expect(Array.isArray(summary.toolsMentioned)).toBe(true);
      expect(Array.isArray(summary.keyTakeaways)).toBe(true);
      expect(Array.isArray(summary.resourcesShared)).toBe(true);
      expect(typeof summary.totalDuration).toBe('number');
    });

    it('should include section details when available', async () => {
      setupSuccessfulMocks();
      const result = await generateLectureSummary(sampleChunks);
      
      if (result.summary.sections.length > 0) {
        const section = result.summary.sections[0];
        expect(section.title).toBeTruthy();
        expect(section.timestampStart).toBeTruthy();
        expect(section.timestampEnd).toBeTruthy();
        expect(section.durationMins).toBeGreaterThan(0);
        expect(section.summary).toBeTruthy();
      }
    });

    it('should include tool details when available', async () => {
      setupSuccessfulMocks();
      const result = await generateLectureSummary(sampleChunks);
      
      if (result.summary.toolsMentioned.length > 0) {
        const tool = result.summary.toolsMentioned[0];
        expect(tool.name).toBeTruthy();
        expect(tool.category).toBeTruthy();
        expect(tool.firstMentioned).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(Array.isArray(tool.useCases)).toBe(true);
      }
    });
  });

  describe('Performance and limits', () => {
    it('should handle large chunk arrays', async () => {
      setupSuccessfulMocks();
      const largeChunks = Array(50).fill(null).map((_, index) => ({
        text: `Chunk ${index} content with some meaningful text about Docker and containerization.`,
        startTime: `00:${index.toString().padStart(2, '0')}:00.000`,
        endTime: `00:${(index + 1).toString().padStart(2, '0')}:00.000`,
        tokenCount: 20,
        metadata: { chunkIndex: index, hasOverlap: index > 0 }
      }));
      
      const result = await generateLectureSummary(largeChunks);
      
      expect(result.chunksProcessed).toBe(50);
      expect(result.summary).toBeDefined();
    });

    it('should respect configuration limits', async () => {
      setupSuccessfulMocks();
      const config: SummaryConfig = {
        maxSections: 3,
        minSectionDuration: 2,
        includeTechnicalDetails: true,
        includeDemonstrations: true,
        includeResources: true,
        summaryStyle: 'comprehensive'
      };
      
      const result = await generateLectureSummary(sampleChunks, config);
      
      expect(result.summary.sections.length).toBeLessThanOrEqual(3);
    });
  });
});
