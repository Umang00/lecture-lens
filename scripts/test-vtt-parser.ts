/**
 * Test VTT Parser with Sample Files
 * Demonstrates VTT parsing functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseVTTWithIntroDetection, filterIntroSegments } from '../lib/vtt';

async function testVTTParser() {
  console.log('🧪 Testing VTT Parser with Sample Files\n');

  try {
    // Read sample VTT file
    const vttPath = path.join(__dirname, '../test-data/sample-lecture.vtt');
    const vttContent = fs.readFileSync(vttPath, 'utf-8');
    
    console.log('📄 Sample VTT Content:');
    console.log('━'.repeat(50));
    console.log(vttContent);
    console.log('━'.repeat(50));
    
    // Parse VTT with intro detection
    console.log('\n🔍 Parsing VTT with intro detection...');
    const result = parseVTTWithIntroDetection(vttContent);
    
    console.log(`\n📊 Results:`);
    console.log(`  • Total segments: ${result.segments.length}`);
    console.log(`  • Lecture starts at segment: ${result.lectureStartIndex}`);
    console.log(`  • Total duration: ${Math.floor(result.totalDuration / 60)} minutes`);
    
    // Show all segments
    console.log('\n📝 All Segments:');
    result.segments.forEach((segment, index) => {
      const marker = index === result.lectureStartIndex ? '🎯' : '  ';
      console.log(`${marker} ${index}: [${segment.startTime}] ${segment.text}`);
    });
    
    // Show filtered segments (without intro)
    const lectureSegments = filterIntroSegments(result.segments, result.lectureStartIndex);
    console.log(`\n🎓 Lecture Content (${lectureSegments.length} segments):`);
    lectureSegments.forEach((segment, index) => {
      console.log(`  ${index}: [${segment.startTime}] ${segment.text}`);
    });
    
    console.log('\n✅ VTT Parser test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVTTParser();
