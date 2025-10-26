/**
 * Resource processing pipeline: scrape → chunk → embed → store
 */

import { getSupabaseAdmin } from '../db/client';
import { generateEmbeddings } from '../ai/embeddings';
import { generateResourceSummary } from '../ai/summarizer';
import { countTokens } from '../vtt/token-counter';
import type { ResourceType, ScrapedContent } from './types';
import { githubScraper } from './github';
import { youtubeScraper } from './youtube';
import { blogScraper } from './blog';
import { rssScraper } from './rss';

const MAX_CHUNK_TOKENS = 800;
const MIN_CHUNK_TOKENS = 300;
const OVERLAP_TOKENS = 50;

/**
 * Get appropriate scraper for resource type
 */
function getScraper(type: ResourceType) {
  switch (type) {
    case 'github':
      return githubScraper;
    case 'youtube':
      return youtubeScraper;
    case 'rss':
      return rssScraper;
    case 'blog':
    case 'other':
      return blogScraper;
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

/**
 * Chunk resource content into smaller pieces for embedding
 */
function chunkResourceContent(content: string): Array<{
  text: string;
  chunkIndex: number;
  tokenCount: number;
}> {
  const chunks: Array<{ text: string; chunkIndex: number; tokenCount: number }> = [];

  // Split by paragraphs first
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph);

    // If adding this paragraph exceeds max, save current chunk and start new one
    if (currentTokens + paragraphTokens > MAX_CHUNK_TOKENS && currentTokens >= MIN_CHUNK_TOKENS) {
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex,
        tokenCount: currentTokens,
      });

      // Start new chunk with overlap (last part of previous chunk)
      const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const overlapText = sentences.slice(-2).join('. ') + '. ';
      const overlapTokens = countTokens(overlapText);

      currentChunk = overlapTokens <= OVERLAP_TOKENS ? overlapText : '';
      currentTokens = overlapTokens <= OVERLAP_TOKENS ? overlapTokens : 0;
      chunkIndex++;
    }

    // Add paragraph to current chunk
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    currentTokens += paragraphTokens;
  }

  // Add final chunk if it has content
  if (currentChunk.trim() && currentTokens > 0) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex,
      tokenCount: currentTokens,
    });
  }

  // If no chunks created (content too short), create single chunk
  if (chunks.length === 0 && content.trim()) {
    chunks.push({
      text: content.trim(),
      chunkIndex: 0,
      tokenCount: countTokens(content),
    });
  }

  return chunks;
}

/**
 * Process resource: scrape, chunk, embed, summarize, and store
 */
export async function processResource(params: {
  url: string;
  type: ResourceType;
  cohortId: string;
  lectureId?: string;
  isGlobal?: boolean;
  createdBy?: string;
}): Promise<{
  resourceId: string;
  chunkCount: number;
}> {
  const { url, type, cohortId, lectureId, isGlobal = false, createdBy } = params;
  const supabase = getSupabaseAdmin();

  // 1. Scrape content
  console.log(`[Resource Processor] Scraping ${type} resource: ${url}`);
  const scraper = getScraper(type);

  if (!scraper.validate(url)) {
    throw new Error(`Invalid URL for ${type} resource`);
  }

  const scraped: ScrapedContent = await scraper.scrape(url);
  console.log(`[Resource Processor] Scraped ${scraped.content.length} characters`);

  // 2. Generate summary
  console.log('[Resource Processor] Generating summary...');
  const summary = await generateResourceSummary(scraped.content, scraped.title);

  // 3. Insert resource record
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .insert({
      url,
      type,
      title: scraped.title,
      summary,
      content: scraped.content,
      metadata: scraped.metadata,
      is_global: isGlobal,
      created_by: createdBy,
      scraped_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (resourceError || !resource) {
    throw new Error(`Failed to create resource: ${resourceError?.message}`);
  }

  const resourceId = resource.id;
  console.log(`[Resource Processor] Created resource: ${resourceId}`);

  // 4. Link to lecture if specified
  if (lectureId) {
    const { error: linkError } = await supabase
      .from('lecture_resources')
      .insert({
        lecture_id: lectureId,
        resource_id: resourceId,
        mention_context: `Added via resource processor`,
      });

    if (linkError) {
      console.warn(`Failed to link resource to lecture: ${linkError.message}`);
    }
  }

  // 5. Chunk content
  console.log('[Resource Processor] Chunking content...');
  const chunks = chunkResourceContent(scraped.content);
  console.log(`[Resource Processor] Created ${chunks.length} chunks`);

  if (chunks.length === 0) {
    throw new Error('No chunks created from content');
  }

  // 6. Generate embeddings in batches
  console.log('[Resource Processor] Generating embeddings...');
  const chunkTexts = chunks.map(c => c.text);
  const embeddings = await generateEmbeddings(chunkTexts);

  // 7. Store chunks with embeddings
  console.log('[Resource Processor] Storing chunks...');
  const knowledgeChunks = chunks.map((chunk, index) => ({
    type: 'resource' as const,
    resource_id: resourceId,
    lecture_id: null,
    text: chunk.text,
    embedding: `[${embeddings[index].join(',')}]`, // Convert to PostgreSQL vector format
    metadata: {
      resourceType: type,
      resourceTitle: scraped.title,
      resourceUrl: url,
      mentionedInLecture: lectureId || null,
      chunkIndex: chunk.chunkIndex,
    },
    cohort_id: cohortId,
    chunk_index: chunk.chunkIndex,
    token_count: chunk.tokenCount,
  }));

  const { error: chunkError } = await supabase
    .from('knowledge_chunks')
    .insert(knowledgeChunks);

  if (chunkError) {
    // Clean up resource if chunk insertion fails
    await supabase.from('resources').delete().eq('id', resourceId);
    throw new Error(`Failed to store chunks: ${chunkError.message}`);
  }

  console.log(`[Resource Processor] Processing complete for resource ${resourceId}`);

  return {
    resourceId,
    chunkCount: chunks.length,
  };
}

/**
 * Scrape resource without processing (for testing)
 */
export async function scrapeResourceOnly(url: string, type: ResourceType): Promise<ScrapedContent> {
  const scraper = getScraper(type);

  if (!scraper.validate(url)) {
    throw new Error(`Invalid URL for ${type} resource`);
  }

  return scraper.scrape(url);
}
