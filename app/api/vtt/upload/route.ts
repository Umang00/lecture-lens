/**
 * VTT Upload API Endpoint
 * Handles VTT file upload and initiates background processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/db/client';
import { processVTTFile } from '@/lib/vtt/processor';

// Request validation schema
const UploadSchema = z.object({
  cohortId: z.string().uuid('Invalid cohort ID'),
  moduleId: z.string().uuid('Invalid module ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  instructor: z.string().max(100, 'Instructor name too long').optional()
});

/**
 * POST /api/vtt/upload
 * Uploads VTT file and initiates processing
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { user, error: authError } = await authenticate(req);
    if (authError) {
      return NextResponse.json(
        { error: authError },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await req.formData();
    const vttFile = formData.get('vtt') as File;
    const cohortId = formData.get('cohortId') as string;
    const moduleId = formData.get('moduleId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const instructor = formData.get('instructor') as string;

    // 3. Validate request
    const validation = UploadSchema.safeParse({
      cohortId,
      moduleId,
      title,
      description,
      instructor
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    // 4. Validate VTT file
    if (!vttFile) {
      return NextResponse.json(
        { error: 'VTT file is required' },
        { status: 400 }
      );
    }

    if (vttFile.type !== 'text/vtt' && !vttFile.name.endsWith('.vtt')) {
      return NextResponse.json(
        { error: 'File must be a VTT file' },
        { status: 400 }
      );
    }

    if (vttFile.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // 5. Verify user has access to cohort
    const { data: userCohorts, error: cohortError } = await supabaseAdmin
      .from('user_cohorts')
      .select('cohort_id')
      .eq('user_id', user.id)
      .eq('cohort_id', cohortId);

    if (cohortError || !userCohorts || userCohorts.length === 0) {
      return NextResponse.json(
        { error: 'Access denied to this cohort' },
        { status: 403 }
      );
    }

    // 6. Create lecture record
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from('lectures')
      .insert({
        title: validation.data.title,
        description: validation.data.description,
        instructor: validation.data.instructor,
        module_id: validation.data.moduleId,
        cohort_id: validation.data.cohortId,
        status: 'processing',
        vtt_filename: vttFile.name,
        vtt_size: vttFile.size,
        created_by: user.id
      })
      .select()
      .single();

    if (lectureError) {
      console.error('[VTT Upload] Failed to create lecture:', lectureError);
      return NextResponse.json(
        { error: 'Failed to create lecture record' },
        { status: 500 }
      );
    }

    // 7. Upload VTT file to Supabase Storage
    const vttContent = await vttFile.text();
    const fileName = `${lecture.id}/${vttFile.name}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('lecture-vtts')
      .upload(fileName, vttContent, {
        contentType: 'text/vtt',
        upsert: false
      });

    if (uploadError) {
      console.error('[VTT Upload] Failed to upload file:', uploadError);
      
      // Clean up lecture record
      await supabaseAdmin
        .from('lectures')
        .delete()
        .eq('id', lecture.id);

      return NextResponse.json(
        { error: 'Failed to upload VTT file' },
        { status: 500 }
      );
    }

    // 8. Start background processing
    console.log(`🚀 Starting VTT processing for lecture ${lecture.id}`);
    
    // Process in background (don't await)
    processVTTFile(lecture.id, vttContent, user.id).catch(error => {
      console.error(`❌ VTT processing failed for lecture ${lecture.id}:`, error);
      
      // Update lecture status to failed
      supabaseAdmin
        .from('lectures')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', lecture.id);
    });

    // 9. Return success response
    return NextResponse.json({
      success: true,
      lectureId: lecture.id,
      status: 'processing',
      message: 'VTT file uploaded and processing started'
    });

  } catch (error) {
    console.error('[VTT Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
