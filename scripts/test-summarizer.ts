/**
 * Manual test script for Lecture Summary Generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseVTTWithIntroDetection, chunkVTT } from '../lib/vtt';
import { generateLectureSummary, DEFAULT_SUMMARY_CONFIG } from '../lib/ai';

async function main() {
  console.log('🧪 Testing Lecture Summary Generation with Sample Files\n');

  // Check if OpenRouter API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY environment variable is required');
    console.log('Please set your OpenRouter API key in .env.local:');
    console.log('OPENROUTER_API_KEY=sk-or-xxx...');
    process.exit(1);
  }

  const sampleVttPath = join(process.cwd(), 'test-data', 'sample-lecture.vtt');
  const vttContent = readFileSync(sampleVttPath, 'utf-8');

  console.log('📄 Sample VTT Content:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(vttContent);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔍 Parsing VTT with intro detection...');
  const parseResult = parseVTTWithIntroDetection(vttContent);

  console.log('\n📊 Parse Results:');
  console.log(`  • Total segments: ${parseResult.segments.length}`);
  console.log(`  • Lecture starts at segment: ${parseResult.lectureStartIndex}`);
  console.log(`  • Total duration: ${parseResult.totalDuration.toFixed(0)} minutes`);

  console.log('\n📦 Chunking lecture content...');
  const lectureSegments = parseResult.segments.slice(parseResult.lectureStartIndex);
  const chunks = await chunkVTT(lectureSegments);

  console.log('\n📊 Chunking Results:');
  console.log(`  • Total chunks: ${chunks.length}`);
  
  chunks.forEach((chunk, index) => {
    console.log(`\n  Chunk ${index}:`);
    console.log(`    • Time: ${chunk.startTime} → ${chunk.endTime}`);
    console.log(`    • Tokens: ${chunk.tokenCount}`);
    console.log(`    • Text: "${chunk.text.substring(0, 100)}${chunk.text.length > 100 ? '...' : ''}"`);
  });

  console.log('\n📝 Generating comprehensive lecture summary...');
  console.log('⚠️  This will make multiple API calls to OpenRouter (costs money)');
  
  try {
    const result = await generateLectureSummary(
      chunks, 
      DEFAULT_SUMMARY_CONFIG,
      (step, progress) => {
        console.log(`  📈 ${step}: ${progress}%`);
      }
    );

    console.log('\n📊 Summary Generation Results:');
    console.log(`  • Processing time: ${result.processingTime.toFixed(1)}s`);
    console.log(`  • Chunks processed: ${result.chunksProcessed}`);
    console.log(`  • Tokens used: ${result.tokensUsed}`);
    console.log(`  • Confidence: ${(result.confidence * 100).toFixed(1)}%`);

    console.log('\n📋 Executive Overview:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(result.summary.executiveOverview);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📚 Sections:');
    result.summary.sections.forEach((section, index) => {
      console.log(`\n  ${index + 1}. ${section.title}`);
      console.log(`     • Time: ${section.timestampStart} → ${section.timestampEnd} (${section.durationMins} mins)`);
      console.log(`     • Summary: ${section.summary}`);
      
      if (section.keyConcepts.length > 0) {
        console.log(`     • Key Concepts:`);
        section.keyConcepts.forEach(concept => {
          console.log(`       - ${concept.concept} (${concept.timestamp}): ${concept.explanation}`);
        });
      }
      
      if (section.demonstrations.length > 0) {
        console.log(`     • Demonstrations:`);
        section.demonstrations.forEach(demo => {
          console.log(`       - ${demo.title} (${demo.timestamp}): ${demo.description}`);
        });
      }
    });

    console.log('\n🛠️  Tools Mentioned:');
    result.summary.toolsMentioned.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} (${tool.category})`);
      console.log(`     • First mentioned: ${tool.firstMentioned}`);
      console.log(`     • Description: ${tool.description}`);
      if (tool.useCases.length > 0) {
        console.log(`     • Use cases: ${tool.useCases.join(', ')}`);
      }
    });

    console.log('\n📖 Resources Shared:');
    result.summary.resourcesShared.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource}`);
    });

    console.log('\n🎯 Key Takeaways:');
    result.summary.keyTakeaways.forEach((takeaway, index) => {
      console.log(`  ${index + 1}. ${takeaway}`);
    });

    console.log('\n✅ Lecture summary generation test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Summary generation failed:');
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
