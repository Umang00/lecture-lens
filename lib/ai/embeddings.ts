/**
 * Embedding Generation Module
 * Generates embeddings for text chunks using OpenRouter API
 */

import OpenAI from 'openai';
import { createOpenRouterClient, getEmbeddingModel, OPENROUTER_CONFIG } from './openrouter';
import type { Chunk } from '../vtt/types';

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates embeddings for an array of texts
 * @param texts Array of text strings to embed
 * @param batchSize Number of texts per batch (default: 10)
 * @param onProgress Optional progress callback
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(
  texts: string[],
  batchSize: number = OPENROUTER_CONFIG.BATCH_SIZE,
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  console.log(`🔮 Generating embeddings for ${texts.length} texts in batches of ${batchSize}...`);
  
  const client = createOpenRouterClient();
  const model = getEmbeddingModel();
  const embeddings: number[][] = [];
  
  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(texts.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} texts)`);
    
    try {
      const response = await client.embeddings.create({
        model,
        input: batch
      });
      
      const batchEmbeddings = response.data.map(item => item.embedding);
      embeddings.push(...batchEmbeddings);
      
      onProgress?.(i + batch.length, texts.length);
      
      // Rate limiting: wait between batches (except for last batch)
      if (i + batchSize < texts.length) {
        console.log(`⏳ Waiting ${OPENROUTER_CONFIG.BATCH_DELAY_MS}ms for rate limiting...`);
        await sleep(OPENROUTER_CONFIG.BATCH_DELAY_MS);
      }
      
    } catch (error) {
      console.error(`❌ Error generating embeddings for batch ${batchNumber}:`, error);
      throw new Error(`Failed to generate embeddings for batch ${batchNumber}: ${error}`);
    }
  }
  
  console.log(`✅ Generated ${embeddings.length} embeddings successfully`);
  return embeddings;
}

/**
 * Generates embeddings for chunks with metadata preservation
 * @param chunks Array of chunks to embed
 * @param onProgress Optional progress callback
 * @returns Array of chunk-embedding pairs
 */
export async function generateEmbeddingsBatch(
  chunks: Chunk[],
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ chunk: Chunk, embedding: number[] }>> {
  if (chunks.length === 0) {
    return [];
  }

  console.log(`🔮 Generating embeddings for ${chunks.length} chunks...`);
  
  // Extract texts from chunks
  const texts = chunks.map(chunk => chunk.text);
  
  // Generate embeddings
  const embeddings = await generateEmbeddings(texts, OPENROUTER_CONFIG.BATCH_SIZE, onProgress);
  
  // Combine chunks with their embeddings
  const results = chunks.map((chunk, index) => ({
    chunk,
    embedding: embeddings[index]
  }));
  
  console.log(`✅ Generated embeddings for ${results.length} chunks`);
  return results;
}

/**
 * Generates a single embedding for a text
 * @param text Text to embed
 * @returns Embedding vector
 */
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], 1);
  return embeddings[0];
}

/**
 * Validates embedding dimensions
 * @param embedding The embedding vector to validate
 * @returns True if embedding has correct dimensions
 */
export function validateEmbedding(embedding: number[]): boolean {
  return Array.isArray(embedding) && 
         embedding.length === OPENROUTER_CONFIG.EMBEDDING_DIMENSIONS &&
         embedding.every(val => typeof val === 'number' && !isNaN(val));
}

/**
 * Validates multiple embeddings
 * @param embeddings Array of embedding vectors
 * @returns True if all embeddings are valid
 */
export function validateEmbeddings(embeddings: number[][]): boolean {
  return embeddings.every(embedding => validateEmbedding(embedding));
}

/**
 * Gets embedding statistics
 * @param embeddings Array of embedding vectors
 * @returns Statistics about the embeddings
 */
export function getEmbeddingStats(embeddings: number[][]): {
  count: number;
  dimensions: number;
  averageMagnitude: number;
  minMagnitude: number;
  maxMagnitude: number;
} {
  if (embeddings.length === 0) {
    return {
      count: 0,
      dimensions: 0,
      averageMagnitude: 0,
      minMagnitude: 0,
      maxMagnitude: 0
    };
  }

  const dimensions = embeddings[0].length;
  const magnitudes = embeddings.map(embedding => {
    const sumOfSquares = embedding.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares);
  });

  const averageMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
  const minMagnitude = Math.min(...magnitudes);
  const maxMagnitude = Math.max(...magnitudes);

  return {
    count: embeddings.length,
    dimensions,
    averageMagnitude: Math.round(averageMagnitude * 1000) / 1000,
    minMagnitude: Math.round(minMagnitude * 1000) / 1000,
    maxMagnitude: Math.round(maxMagnitude * 1000) / 1000
  };
}
