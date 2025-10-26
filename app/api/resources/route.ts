/**
 * Resource Management API
 * POST: Add new resource (triggers scraping and processing)
 * GET: List resources for user's cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getSupabaseAdmin, getUserCohorts } from '@/lib/db/client';
import { processResource } from '@/lib/scrapers/processor';
import { validateResourceUrl } from '@/lib/scrapers/validators';
import type { ResourceType } from '@/lib/scrapers/types';

/**
 * POST /api/resources - Add new resource
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Check if user is admin or instructor (ONLY they can add resources)
    const supabase = getSupabaseAdmin();
    const { data: userRole, error: roleError } = await supabase
      .from('user_cohorts')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'instructor'])
      .limit(1)
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          details: 'Only instructors and admins can add resources'
        },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await req.json();
    const { url, type, lectureId, isGlobal = false } = body;

    // Validate required fields
    if (!url || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL and type are required',
          details: 'Please provide both url and type in request body'
        },
        { status: 400 }
      );
    }

    // 4. Validate resource type
    const validTypes: ResourceType[] = ['github', 'youtube', 'blog', 'rss', 'other'];
    if (!validTypes.includes(type as ResourceType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid resource type',
          details: `Type must be one of: ${validTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 5. Validate URL format matches type
    if (!validateResourceUrl(url, type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid URL for ${type} resource`,
          details: 'URL format does not match expected pattern',
        },
        { status: 400 }
      );
    }

    // 6. Check if URL already exists
    const { data: existing } = await supabase
      .from('resources')
      .select('id, title')
      .eq('url', url)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource already exists',
          resourceId: existing.id,
          title: existing.title,
        },
        { status: 409 }
      );
    }

    // 7. Get user's cohort (use first cohort for now)
    const cohorts = await getUserCohorts(user.id);
    if (cohorts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not assigned to any cohort' },
        { status: 403 }
      );
    }

    const cohortId = cohorts[0]; // Use first cohort

    // 8. Verify lecture exists if lectureId provided
    if (lectureId) {
      const { data: lecture } = await supabase
        .from('lectures')
        .select('id')
        .eq('id', lectureId)
        .single();

      if (!lecture) {
        return NextResponse.json(
          { success: false, error: 'Lecture not found' },
          { status: 404 }
        );
      }
    }

    // 9. Process resource (scrape, chunk, embed, store)
    console.log(`[API] Processing ${type} resource: ${url}`);
    const result = await processResource({
      url,
      type,
      cohortId,
      lectureId,
      isGlobal,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      resourceId: result.resourceId,
      chunkCount: result.chunkCount,
      message: 'Resource added and indexed successfully',
    });

  } catch (error: any) {
    console.error('[API] Resource processing error:', error);

    // Handle specific errors
    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'API rate limit exceeded',
          details: 'Please try again in a few minutes',
        },
        { status: 429 }
      );
    }

    if (error.message.includes('unavailable') || error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource unavailable',
          details: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message.includes('disabled') || error.message.includes('transcript')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content unavailable',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process resource',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resources - List resources
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') as ResourceType | null;
    const lectureId = searchParams.get('lectureId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 3. Get user's cohorts
    const cohorts = await getUserCohorts(user.id);
    if (cohorts.length === 0) {
      return NextResponse.json(
        { success: true, resources: [] },
        { status: 200 }
      );
    }

    // 4. Build query
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('resources')
      .select(`
        id,
        url,
        type,
        title,
        summary,
        metadata,
        created_at,
        scraped_at,
        lecture_resources (
          lecture_id,
          lectures (
            id,
            title,
            instructor
          )
        )
      `)
      .limit(limit);

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    // Filter by lecture if specified
    if (lectureId) {
      query = query.eq('lecture_resources.lecture_id', lectureId);
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const { data: resources, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      resources: resources || [],
      count: resources?.length || 0,
    });

  } catch (error: any) {
    console.error('[API] Error fetching resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch resources',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
