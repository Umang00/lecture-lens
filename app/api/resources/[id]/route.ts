/**
 * Resource Detail API
 * GET: Get detailed information about a specific resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getSupabaseAdmin } from '@/lib/db/client';

/**
 * GET /api/resources/[id] - Get resource details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resourceId = params.id;

    // 2. Fetch resource details
    const supabase = getSupabaseAdmin();
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        id,
        url,
        type,
        title,
        summary,
        content,
        metadata,
        is_global,
        created_at,
        scraped_at,
        lecture_resources (
          lecture_id,
          mention_context,
          lectures (
            id,
            title,
            instructor,
            lecture_date,
            modules (
              name,
              sequence
            )
          )
        )
      `)
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found',
        },
        { status: 404 }
      );
    }

    // 3. Get chunk count for this resource
    const { count: chunkCount } = await supabase
      .from('knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('resource_id', resourceId);

    // 4. Format response
    const mentionedInLectures = resource.lecture_resources?.map((lr: any) => ({
      lectureId: lr.lecture_id,
      lectureTitle: lr.lectures?.title,
      instructor: lr.lectures?.instructor,
      date: lr.lectures?.lecture_date,
      module: lr.lectures?.modules?.name,
      moduleNumber: lr.lectures?.modules?.sequence,
      mentionContext: lr.mention_context,
    })) || [];

    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        url: resource.url,
        type: resource.type,
        title: resource.title,
        summary: resource.summary,
        content: resource.content,
        metadata: resource.metadata,
        isGlobal: resource.is_global,
        chunkCount: chunkCount || 0,
        scrapedAt: resource.scraped_at,
        createdAt: resource.created_at,
        mentionedInLectures,
      },
    });

  } catch (error: any) {
    console.error('[API] Error fetching resource details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch resource details',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resources/[id] - Delete a resource (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin (optional: add role check here)
    // For now, allow any authenticated user to delete their resources

    const resourceId = params.id;
    const supabase = getSupabaseAdmin();

    // 3. Delete resource (cascade will handle chunks and links)
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
    });

  } catch (error: any) {
    console.error('[API] Error deleting resource:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete resource',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
