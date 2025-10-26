/**
 * OpenRouter AI Client Configuration
 * Handles authentication and client setup for OpenRouter API
 */

import OpenAI from 'openai';

// OpenRouter configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = 'text-embedding-3-small'; // 1536 dimensions

/**
 * Creates and configures OpenRouter client
 * @returns Configured OpenAI client for OpenRouter
 */
export function createOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Lecture Lens - Cohort Assistant'
    }
  });
}

/**
 * Gets the embedding model name for OpenRouter
 * @returns The model name for embeddings
 */
export function getEmbeddingModel(): string {
  return OPENROUTER_MODEL;
}

/**
 * Validates OpenRouter configuration
 * @returns True if configuration is valid
 */
export function validateOpenRouterConfig(): boolean {
  try {
    const client = createOpenRouterClient();
    return !!client;
  } catch (error) {
    console.error('[OpenRouter] Configuration validation failed:', error);
    return false;
  }
}

/**
 * OpenRouter API limits and configuration
 */
export const OPENROUTER_CONFIG = {
  // Rate limits
  REQUESTS_PER_MINUTE: 15,
  BATCH_SIZE: 10,
  BATCH_DELAY_MS: 4000, // 4 seconds between batches
  
  // Model configuration
  EMBEDDING_MODEL: OPENROUTER_MODEL,
  EMBEDDING_DIMENSIONS: 1536,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  EXPONENTIAL_BACKOFF: true
} as const;
