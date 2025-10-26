/**
 * Query API Endpoint
 * Handles chat queries with context support and hybrid ranking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth/middleware';
import { queryKnowledge } from '@/lib/rag';
import { getSupabaseAdmin } from '@/lib/db/client';

// Request validation schema
const QueryRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  lectureId: z.string().uuid().optional(),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

// Response schema
const QueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    id: z.string(),
    type: z.enum(['lecture', 'resource']),
    title: z.string(),
    text: z.string(),
    timestamp: z.string().optional(),
    url: z.string().optional(),
    similarity: z.number(),
    metadata: z.record(z.string(), z.any())
  })),
  suggestedFollowUps: z.array(z.string()).optional()
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Query API called');
    
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log(`👤 Authenticated user: ${user.id}`);
    
    // 2. Validate request body
    const body = await req.json();
    const validated = QueryRequestSchema.parse(body);
    
    console.log(`📝 Query: "${validated.query}"`);
    console.log(`💬 Context: ${validated.context?.length || 0} messages`);
    
    // 3. Check if user has cohort assignment
    const supabase = getSupabaseAdmin();
    const { data: userCohorts, error: cohortError } = await supabase
      .from('user_cohorts')
      .select('cohort_id, role')
      .eq('user_id', user.id);
    
    if (cohortError) {
      console.error('Cohort lookup error:', cohortError);
      return NextResponse.json(
        { error: 'Failed to verify user access' },
        { status: 500 }
      );
    }
    
    if (!userCohorts || userCohorts.length === 0) {
      return NextResponse.json(
        { 
          answer: "You haven't been assigned to any cohort yet. Please contact your instructor to get access to the knowledge base.",
          sources: []
        },
        { status: 200 }
      );
    }
    
    console.log(`🎓 User cohorts: ${userCohorts.map(uc => uc.cohort_id).join(', ')}`);
    
    // 4. Execute RAG query
    const startTime = Date.now();
    const response = await queryKnowledge(
      validated.query,
      user.id,
      validated.context
    );
    const queryTime = Date.now() - startTime;
    
    console.log(`⏱️ Query completed in ${queryTime}ms`);
    console.log(`📊 Found ${response.sources.length} sources`);
    
    // 5. Validate response
    const validatedResponse = QueryResponseSchema.parse(response);
    
    // 6. Add performance metadata
    const responseWithMetadata = {
      ...validatedResponse,
      metadata: {
        queryTime,
        userId: user.id,
        userCohorts: userCohorts.map(uc => uc.cohort_id),
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(responseWithMetadata);
    
  } catch (error) {
    console.error('Query API error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Handle RAG errors
    if (error instanceof Error && error.message.includes('Failed to query knowledge base')) {
      return NextResponse.json(
        { 
          answer: "I'm having trouble accessing the knowledge base right now. Please try again in a moment.",
          sources: [],
          error: 'Knowledge base temporarily unavailable'
        },
        { status: 200 } // Return 200 with error message instead of 500
      );
    }
    
    // Generic error
    return NextResponse.json(
      { 
        answer: "I encountered an error while processing your question. Please try again.",
        sources: [],
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
