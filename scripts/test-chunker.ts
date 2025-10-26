/**
 * Manual test script for VTT Chunker
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseVTTWithIntroDetection, chunkVTT, analyzeChunks } from '../lib/vtt';

async function main() {
  console.log('🧪 Testing VTT Chunker with Sample Files\n');

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

  console.log('\n📝 All Segments:');
  parseResult.segments.forEach((segment, index) => {
    const prefix = index === parseResult.lectureStartIndex ? '🎯 ' : '   ';
    console.log(`${prefix}${index}: [${segment.startTime}] ${segment.text}`);
  });

  console.log('\n🎓 Lecture Content (excluding intro):');
  const lectureSegments = parseResult.segments.slice(parseResult.lectureStartIndex);
  lectureSegments.forEach((segment, index) => {
    console.log(`  ${index}: [${segment.startTime}] ${segment.text}`);
  });

  console.log('\n📦 Chunking lecture content...');
  const chunks = await chunkVTT(lectureSegments);

  console.log('\n📊 Chunking Results:');
  console.log(`  • Total chunks: ${chunks.length}`);
  
  chunks.forEach((chunk, index) => {
    console.log(`\n  Chunk ${index}:`);
    console.log(`    • Time: ${chunk.startTime} → ${chunk.endTime}`);
    console.log(`    • Tokens: ${chunk.tokenCount}`);
    console.log(`    • Text: "${chunk.text.substring(0, 100)}${chunk.text.length > 100 ? '...' : ''}"`);
    console.log(`    • Has overlap: ${chunk.metadata.hasOverlap}`);
  });

  console.log('\n📈 Chunk Analysis:');
  const analysis = analyzeChunks(chunks);
  console.log(`  • Average tokens: ${analysis.averageTokens}`);
  console.log(`  • Min tokens: ${analysis.minTokens}`);
  console.log(`  • Max tokens: ${analysis.maxTokens}`);
  console.log(`  • Chunks with overlap: ${analysis.chunksWithOverlap}`);
  console.log(`  • Quality score: ${analysis.qualityScore}`);

  console.log('\n✅ VTT Chunker test completed successfully!');
}

main().catch(console.error);
