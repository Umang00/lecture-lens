/**
 * AI Module - Main exports
 * Centralized exports for AI functionality
 */

// OpenRouter client
export { 
  createOpenRouterClient, 
  getEmbeddingModel, 
  validateOpenRouterConfig,
  OPENROUTER_CONFIG 
} from './openrouter';

// Embedding generation
export { 
  generateEmbeddings,
  generateEmbeddingsBatch,
  generateSingleEmbedding,
  validateEmbedding,
  validateEmbeddings,
  getEmbeddingStats
} from './embeddings';

// Summary generation
export { 
  generateLectureSummary,
  DEFAULT_SUMMARY_CONFIG
} from './summarizer';

// Summary types
export type {
  LectureSummary,
  Section,
  Tool,
  Resource,
  SummaryConfig,
  SummarizationResult,
  ConceptWithTimestamp,
  Demo
} from './summarizer-types';
