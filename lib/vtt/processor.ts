/**
 * VTT Processing Pipeline
 * Handles the complete processing of VTT files from upload to database storage
 */

import { supabaseAdmin } from '@/lib/db/client';
import { parseVTTWithIntroDetection, chunkVTT } from './index';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { generateLectureSummary } from '@/lib/ai/summarizer';
import type { Chunk } from './types';

/**
 * Processes a VTT file through the complete pipeline
 * @param lectureId The ID of the lecture record
 * @param vttContent The VTT file content
 * @param userId The user who uploaded the file
 */
export async function processVTTFile(
  lectureId: string,
  vttContent: string,
  userId: string
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`📝 Starting VTT processing for lecture ${lectureId}`);
    
    // Step 1: Parse VTT content
    console.log('🔍 Step 1: Parsing VTT content...');
    const parseResult = parseVTTWithIntroDetection(vttContent);
    
    if (parseResult.segments.length === 0) {
      throw new Error('No segments found in VTT file');
    }
    
    console.log(`✅ Parsed ${parseResult.segments.length} segments`);
    console.log(`🎯 Lecture starts at segment ${parseResult.lectureStartIndex}`);
    console.log(`⏱️  Total duration: ${parseResult.totalDuration.toFixed(0)} minutes`);
    
    // Update progress
    await updateProcessingProgress(lectureId, 'parsing', 20);
    
    // Step 2: Chunk the lecture content (skip intro)
    console.log('📦 Step 2: Chunking lecture content...');
    const lectureSegments = parseResult.segments.slice(parseResult.lectureStartIndex);
    const chunks = await chunkVTT(lectureSegments);
    
    if (chunks.length === 0) {
      throw new Error('No chunks created from lecture content');
    }
    
    console.log(`✅ Created ${chunks.length} chunks`);
    
    // Update progress
    await updateProcessingProgress(lectureId, 'chunking', 40);
    
    // Step 3: Generate embeddings in batches
    console.log('🔮 Step 3: Generating embeddings...');
    const embeddedChunks = await generateEmbeddingsBatch(
      chunks,
      10, // batch size
      (completed, total) => {
        const progress = 40 + (completed / total) * 30; // 40-70% range
        updateProcessingProgress(lectureId, 'embedding', Math.round(progress));
        console.log(`📊 Embedding progress: ${completed}/${total} chunks`);
      }
    );
    
    console.log(`✅ Generated embeddings for ${embeddedChunks.length} chunks`);
    
    // Update progress
    await updateProcessingProgress(lectureId, 'storing', 70);
    
    // Step 4: Store chunks in database
    console.log('💾 Step 4: Storing chunks in database...');
    const chunkInserts = embeddedChunks.map(({ chunk, embedding }) => ({
      lecture_id: lectureId,
      text: chunk.text,
      embedding: embedding,
      start_time: chunk.startTime,
      end_time: chunk.endTime,
      token_count: chunk.tokenCount,
      metadata: {
        chunkIndex: chunk.metadata.chunkIndex,
        hasOverlap: chunk.metadata.hasOverlap,
        lectureTitle: extractLectureTitle(parseResult.segments),
        instructor: extractInstructor(parseResult.segments)
      },
      type: 'lecture',
      cohort_id: await getCohortId(lectureId)
    }));
    
    // Insert chunks in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < chunkInserts.length; i += batchSize) {
      const batch = chunkInserts.slice(i, i + batchSize);
      
      const { error: insertError } = await supabaseAdmin
        .from('knowledge_chunks')
        .insert(batch);
      
      if (insertError) {
        throw new Error(`Failed to insert chunk batch: ${insertError.message}`);
      }
      
      console.log(`📊 Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkInserts.length / batchSize)}`);
    }
    
    console.log(`✅ Stored ${chunkInserts.length} chunks in database`);
    
    // Update progress
    await updateProcessingProgress(lectureId, 'summarizing', 85);
    
    // Step 5: Generate lecture summary
    console.log('📝 Step 5: Generating lecture summary...');
    const summaryResult = await generateLectureSummary(
      chunks,
      undefined, // use default config
      (step, progress) => {
        console.log(`📈 Summary ${step}: ${progress}%`);
      }
    );
    
    console.log(`✅ Generated summary with ${summaryResult.summary.sections.length} sections`);
    console.log(`🛠️  Found ${summaryResult.summary.toolsMentioned.length} tools`);
    console.log(`📚 Found ${summaryResult.summary.resourcesShared.length} resources`);
    
    // Step 6: Update lecture record with summary and mark as completed
    console.log('✅ Step 6: Finalizing lecture record...');
    const processingTime = (Date.now() - startTime) / 1000;
    
    const { error: updateError } = await supabaseAdmin
      .from('lectures')
      .update({
        status: 'completed',
        summary: summaryResult.summary,
        processing_time: processingTime,
        chunks_count: chunks.length,
        tokens_used: summaryResult.tokensUsed,
        confidence: summaryResult.confidence,
        completed_at: new Date().toISOString()
      })
      .eq('id', lectureId);
    
    if (updateError) {
      throw new Error(`Failed to update lecture record: ${updateError.message}`);
    }
    
    console.log(`🎉 VTT processing completed for lecture ${lectureId} in ${processingTime.toFixed(1)}s`);
    
  } catch (error) {
    console.error(`❌ VTT processing failed for lecture ${lectureId}:`, error);
    
    // Update lecture status to failed
    await supabaseAdmin
      .from('lectures')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        failed_at: new Date().toISOString()
      })
      .eq('id', lectureId);
    
    throw error;
  }
}

/**
 * Updates the processing progress for a lecture
 */
async function updateProcessingProgress(
  lectureId: string,
  stage: string,
  progress: number
): Promise<void> {
  try {
    await supabaseAdmin
      .from('lectures')
      .update({
        processing_stage: stage,
        processing_progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', lectureId);
  } catch (error) {
    console.error('Failed to update processing progress:', error);
    // Don't throw - progress updates are not critical
  }
}

/**
 * Gets the cohort ID for a lecture
 */
async function getCohortId(lectureId: string): Promise<string> {
  const { data: lecture, error } = await supabaseAdmin
    .from('lectures')
    .select('cohort_id')
    .eq('id', lectureId)
    .single();
  
  if (error || !lecture) {
    throw new Error('Failed to get cohort ID for lecture');
  }
  
  return lecture.cohort_id;
}

/**
 * Extracts lecture title from segments
 */
function extractLectureTitle(segments: any[]): string | undefined {
  const firstSegments = segments.slice(0, 3);
  const text = firstSegments.map(s => s.text).join(' ');
  
  const titlePatterns = [
    /(?:lecture|session|class|workshop|tutorial):\s*([^.!?]+)/i,
    /(?:today|we'll|we will)\s+(?:cover|discuss|talk about)\s+([^.!?]+)/i,
    /(?:welcome to|introduction to)\s+([^.!?]+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extracts instructor name from segments
 */
function extractInstructor(segments: any[]): string | undefined {
  const firstSegments = segments.slice(0, 5);
  const text = firstSegments.map(s => s.text).join(' ');
  
  const instructorPatterns = [
    /(?:hi|hello|welcome),?\s*(?:i'm|i am)\s+([a-zA-Z\s]+)/i,
    /(?:this is|i'm)\s+([a-zA-Z\s]+)(?:\s+and|,)/i
  ];
  
  for (const pattern of instructorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}
