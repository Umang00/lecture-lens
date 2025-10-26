/**
 * RAG (Retrieval-Augmented Generation) Module
 * Handles vector search, ranking, and LLM-based answer generation
 */

import { Document, VectorStoreIndex, storageContextFromDefaults } from 'llamaindex';
import { SupabaseVectorStore } from '@llamaindex/supabase';
import { createOpenRouterClient, OPENROUTER_CONFIG } from '../ai/openrouter';
import { generateSingleEmbedding } from '../ai/embeddings';
import { getSupabaseAdmin } from '../db/client';
import type { Database } from '@/types/database';

// Types for our RAG system
export interface ChatResponse {
  answer: string;
  sources: Source[];
  suggestedFollowUps?: string[];
}

export interface Source {
  id: string;
  type: 'lecture' | 'resource';
  title: string;
  text: string;
  timestamp?: string;
  url?: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface RankingFactors {
  vectorSimilarity: number; // 0-1
  recencyBoost: number; // 0-0.1
  metadataMatch: number; // 0-0.15
  codePresence: number; // 0-0.08
  resourceTypeRelevance: number; // 0-0.12
}

// Global variables for caching
let _vectorStore: SupabaseVectorStore | null = null;
let _queryEngine: any = null;

/**
 * Initialize the Supabase vector store
 */
function getVectorStore(): SupabaseVectorStore {
  if (!_vectorStore) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables for vector store');
    }

    _vectorStore = new SupabaseVectorStore({
      supabaseUrl,
      supabaseKey,
      table: 'knowledge_chunks', // Our existing table
    });
  }
  
  return _vectorStore;
}

/**
 * Get or create the query engine
 */
export async function getQueryEngine() {
  if (!_queryEngine) {
    const vectorStore = getVectorStore();
    const storageContext = await storageContextFromDefaults({ vectorStore });
    
    // Create index from existing data
    const index = await VectorStoreIndex.fromVectorStore(vectorStore);
    _queryEngine = index.asQueryEngine();
  }
  
  return _queryEngine;
}

/**
 * Query knowledge base with context support
 */
export async function queryKnowledge(
  query: string,
  userId: string,
  context?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  try {
    console.log(`🔍 Querying knowledge for user ${userId}: "${query}"`);
    
    // Get user's cohorts for filtering
    const supabase = getSupabaseAdmin();
    const { data: userCohorts } = await supabase
      .from('user_cohorts')
      .select('cohort_id')
      .eq('user_id', userId);
    
    if (!userCohorts || userCohorts.length === 0) {
      throw new Error('User not assigned to any cohort');
    }
    
    const cohortIds = userCohorts.map(uc => uc.cohort_id);
    
    // Generate query embedding
    const queryEmbedding = await generateSingleEmbedding(query);
    
    // Search knowledge chunks with cohort filtering
    const { data: searchResults, error } = await supabase.rpc('search_knowledge', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: 0.7,
      match_count: 20,
      filter_cohort_id: cohortIds[0], // Use first cohort for now
      filter_type: undefined
    });
    
    if (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search knowledge base');
    }
    
    if (!searchResults || searchResults.length === 0) {
      return {
        answer: "I couldn't find any relevant information in your cohort's knowledge base. Please try rephrasing your question or contact your instructor.",
        sources: []
      };
    }
    
    // Rerank results with hybrid ranking
    const rerankedResults = await rerankResults(searchResults, query);
    
    // Take top 5 results
    const topResults = rerankedResults.slice(0, 5);
    
    // Build context for LLM
    const conversationHistory = context?.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n') || '';
    
    // Generate answer using LLM
    const answer = await generateAnswer(query, topResults, conversationHistory);
    
    // Format sources
    const sources: Source[] = topResults.map(result => ({
      id: result.id,
      type: result.type as 'lecture' | 'resource',
      title: result.metadata?.lectureTitle || result.metadata?.resourceTitle || 'Unknown',
      text: result.text,
      timestamp: result.metadata?.timestamp,
      url: result.metadata?.url,
      similarity: result.similarity,
      metadata: result.metadata
    }));
    
    // Generate follow-up suggestions
    const suggestedFollowUps = await generateFollowUpQuestions(query, answer);
    
    return {
      answer,
      sources,
      suggestedFollowUps
    };
    
  } catch (error) {
    console.error('RAG query error:', error);
    throw new Error(`Failed to query knowledge base: ${error}`);
  }
}

/**
 * Rerank search results using hybrid ranking
 */
async function rerankResults(
  results: any[],
  query: string
): Promise<any[]> {
  const rerankedResults = results.map(result => {
    let score = result.similarity;
    
    // Recency boost (newer content gets slight boost)
    const createdAt = new Date(result.metadata?.created_at || 0);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.1 - (daysSinceCreation / 365) * 0.05);
    score += recencyBoost;
    
    // Metadata match boost (instructor name, title matching)
    const title = result.metadata?.lectureTitle || result.metadata?.resourceTitle || '';
    const instructor = result.metadata?.instructor || '';
    const queryLower = query.toLowerCase();
    
    let metadataMatch = 0;
    if (title.toLowerCase().includes(queryLower)) {
      metadataMatch += 0.1;
    }
    if (instructor.toLowerCase().includes(queryLower)) {
      metadataMatch += 0.05;
    }
    score += metadataMatch;
    
    // Code presence boost (technical queries)
    const hasCode = /```|function|class|import|const|let|var|def |\.py|\.js|\.ts/.test(result.text);
    if (hasCode && /code|function|class|import|programming|development|api|database/.test(queryLower)) {
      score += 0.08;
    }
    
    // Resource type relevance
    const resourceType = result.metadata?.type || '';
    if (resourceType === 'github' && /github|repository|repo|code|development/.test(queryLower)) {
      score += 0.06;
    }
    if (resourceType === 'youtube' && /video|tutorial|watch|demo/.test(queryLower)) {
      score += 0.06;
    }
    if (resourceType === 'blog' && /article|blog|post|guide|tutorial/.test(queryLower)) {
      score += 0.06;
    }
    
    return { ...result, finalScore: score };
  });
  
  // Sort by final score
  return rerankedResults.sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Generate answer using LLM with context
 */
async function generateAnswer(
  query: string,
  sources: any[],
  conversationHistory: string
): Promise<string> {
  const client = createOpenRouterClient();
  
  const sourcesText = sources.map((source, index) => 
    `[${index + 1}] ${source.metadata?.lectureTitle || source.metadata?.resourceTitle || 'Source'}${source.metadata?.timestamp ? ` (${source.metadata.timestamp})` : ''}\n${source.text}`
  ).join('\n\n');
  
  const prompt = `You are a helpful teaching assistant for a coding bootcamp. Answer the student's question using the provided sources. Be concise but comprehensive.

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}

Current question: ${query}

Sources:
${sourcesText}

Instructions:
- Use the sources to provide accurate, helpful answers
- If sources mention specific tools, frameworks, or concepts, include them
- Include timestamps when relevant (e.g., "As mentioned at 15:30 in the Docker lecture...")
- If the question is unclear, ask for clarification
- Keep answers focused and practical for students

Answer:`;

  try {
    const response = await client.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  } catch (error) {
    console.error('LLM generation error:', error);
    throw new Error('Failed to generate answer');
  }
}

/**
 * Generate follow-up question suggestions
 */
async function generateFollowUpQuestions(
  query: string,
  answer: string
): Promise<string[]> {
  const client = createOpenRouterClient();
  
  const prompt = `Based on this question and answer, suggest 2-3 relevant follow-up questions that a student might ask.

Question: ${query}
Answer: ${answer}

Generate 2-3 follow-up questions that are:
- Related to the original question
- Helpful for learning
- Specific and actionable
- Natural for a student to ask

Format as a JSON array of strings:`;

  try {
    const response = await client.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    const questions = JSON.parse(content);
    return Array.isArray(questions) ? questions.slice(0, 3) : [];
  } catch (error) {
    console.error('Follow-up generation error:', error);
    return [];
  }
}

/**
 * Clear cached components (useful for testing)
 */
export function clearCache() {
  _vectorStore = null;
  _queryEngine = null;
}
