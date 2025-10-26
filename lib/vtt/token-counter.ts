/**
 * Token Counting Utilities
 * Provides accurate token counting for text content
 */

/**
 * Estimates token count for text using a simple approximation
 * This is a basic implementation - in production, you might want to use
 * a more sophisticated tokenizer like tiktoken
 * 
 * @param text Text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // Simple approximation: ~4 characters per token for English text
  // This is a rough estimate - actual tokenization varies by model
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Use the more conservative estimate (words are usually closer to actual tokens)
  return Math.ceil(wordCount * 1.3); // 1.3 tokens per word is a reasonable approximation
}

/**
 * Estimates token count for multiple texts
 * @param texts Array of texts to count
 * @returns Array of token counts
 */
export function estimateTokenCounts(texts: string[]): number[] {
  return texts.map(text => estimateTokenCount(text));
}

/**
 * Checks if text is within token limits
 * @param text Text to check
 * @param maxTokens Maximum token limit
 * @returns true if within limits
 */
export function isWithinTokenLimit(text: string, maxTokens: number): boolean {
  return estimateTokenCount(text) <= maxTokens;
}

/**
 * Truncates text to fit within token limit
 * @param text Text to truncate
 * @param maxTokens Maximum token limit
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Calculate approximate character limit
  const charPerToken = text.length / estimatedTokens;
  const maxChars = Math.floor(maxTokens * charPerToken * 0.9); // 90% to be safe
  
  return text.substring(0, maxChars).trim();
}

/**
 * Counts tokens in text (alias for estimateTokenCount for consistency)
 * @param text Text to count tokens for
 * @returns Token count
 */
export function countTokensInText(text: string): number {
  return estimateTokenCount(text);
}

/**
 * Counts tokens in text (main export for backwards compatibility)
 * @param text Text to count tokens for
 * @returns Token count
 */
export function countTokens(text: string): number {
  return estimateTokenCount(text);
}

/**
 * Splits text into chunks that fit within token limits
 * @param text Text to split
 * @param maxTokensPerChunk Maximum tokens per chunk
 * @returns Array of text chunks
 */
export function splitTextByTokenLimit(text: string, maxTokensPerChunk: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence.trim();
    
    if (estimateTokenCount(testChunk) <= maxTokensPerChunk) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence.trim();
      } else {
        // Single sentence is too long, truncate it
        chunks.push(truncateToTokenLimit(sentence.trim(), maxTokensPerChunk));
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
