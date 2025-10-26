/**
 * Manual test script for Embedding Generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseVTTWithIntroDetection, chunkVTT } from '../lib/vtt';
import { generateEmbeddingsBatch, getEmbeddingStats } from '../lib/ai';

async function main() {
  console.log('🧪 Testing Embedding Generation with Sample Files\n');

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

  console.log('\n🔮 Generating embeddings...');
  console.log('⚠️  This will make API calls to OpenRouter (costs money)');
  
  try {
    const results = await generateEmbeddingsBatch(chunks, (current, total) => {
      console.log(`  📈 Progress: ${current}/${total} chunks processed`);
    });

    console.log('\n📊 Embedding Results:');
    console.log(`  • Generated embeddings: ${results.length}`);
    
    // Get embedding statistics
    const embeddings = results.map(r => r.embedding);
    const stats = getEmbeddingStats(embeddings);
    
    console.log('\n📈 Embedding Statistics:');
    console.log(`  • Count: ${stats.count}`);
    console.log(`  • Dimensions: ${stats.dimensions}`);
    console.log(`  • Average magnitude: ${stats.averageMagnitude}`);
    console.log(`  • Min magnitude: ${stats.minMagnitude}`);
    console.log(`  • Max magnitude: ${stats.maxMagnitude}`);

    // Show first few embeddings
    console.log('\n🔍 Sample Embeddings:');
    results.slice(0, 2).forEach((result, index) => {
      console.log(`\n  Chunk ${index} embedding (first 10 dimensions):`);
      console.log(`    [${result.embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);
    });

    console.log('\n✅ Embedding generation test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Embedding generation failed:');
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
