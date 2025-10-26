/**
 * VTT Processing Status API Endpoint
 * Returns the current processing status of a VTT file
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/db/client';

/**
 * GET /api/vtt/status/[lectureId]
 * Returns the processing status of a lecture
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError) {
      return NextResponse.json(
        { error: authError },
        { status: 401 }
      );
    }

    const { lectureId } = params;

    // 2. Validate lecture ID
    if (!lectureId || typeof lectureId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
        { status: 400 }
      );
    }

    // 3. Get lecture details
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from('lectures')
      .select(`
        id,
        title,
        status,
        processing_stage,
        processing_progress,
        error_message,
        chunks_count,
        tokens_used,
        confidence,
        processing_time,
        created_at,
        completed_at,
        failed_at,
        cohort_id,
        module:modules(
          id,
          name
        )
      `)
      .eq('id', lectureId)
      .single();

    if (lectureError) {
      console.error('[VTT Status] Failed to get lecture:', lectureError);
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // 4. Verify user has access to this lecture's cohort
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const { data: userCohorts, error: cohortError } = await supabaseAdmin
      .from('user_cohorts')
      .select('cohort_id')
      .eq('user_id', user.id)
      .eq('cohort_id', lecture.cohort_id);

    if (cohortError || !userCohorts || userCohorts.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this lecture' },
        { status: 403 }
      );
    }

    // 5. Get chunk count if processing is complete
    let chunkCount = 0;
    if (lecture.status === 'completed') {
      const { count } = await supabaseAdmin
        .from('knowledge_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('lecture_id', lectureId);
      
      chunkCount = count || 0;
    }

    // 6. Format response
    const response = {
      lectureId: lecture.id,
      title: lecture.title,
      status: lecture.status,
      processingStage: lecture.processing_stage,
      progress: lecture.processing_progress || 0,
      error: lecture.error_message,
      stats: {
        chunksCount: lecture.chunks_count || chunkCount,
        tokensUsed: lecture.tokens_used,
        confidence: lecture.confidence,
        processingTime: lecture.processing_time
      },
      timestamps: {
        created: lecture.created_at,
        completed: lecture.completed_at,
        failed: lecture.failed_at
      },
      module: lecture.module
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[VTT Status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
