/**
 * Manual test script for VTT Upload API
 * Tests the complete VTT processing pipeline
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { FormData } from 'form-data';

async function main() {
  console.log('🧪 Testing VTT Upload API with Sample Files\n');

  // Check if we have the required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const sampleVttPath = join(process.cwd(), 'test-data', 'sample-lecture.vtt');
  const vttContent = readFileSync(sampleVttPath, 'utf-8');

  console.log('📄 Sample VTT Content:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(vttContent);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create form data for upload
  const formData = new FormData();
  formData.append('vtt', vttContent, {
    filename: 'sample-lecture.vtt',
    contentType: 'text/vtt'
  });
  formData.append('cohortId', 'test-cohort-id'); // You'll need to replace with real cohort ID
  formData.append('moduleId', 'test-module-id'); // You'll need to replace with real module ID
  formData.append('title', 'Test Docker Lecture');
  formData.append('description', 'A sample lecture about Docker containers and their benefits');
  formData.append('instructor', 'Test Instructor');

  console.log('📤 Uploading VTT file...');
  console.log('⚠️  Note: This requires a running Next.js server and valid authentication');
  console.log('⚠️  Make sure to update cohortId and moduleId with real values');
  
  try {
    // Upload to the API endpoint
    const response = await fetch('http://localhost:3000/api/vtt/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Add authentication headers here
        // 'Authorization': 'Bearer your-jwt-token'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Upload failed:', result);
      return;
    }

    console.log('✅ Upload successful!');
    console.log('📊 Response:', result);

    const { lectureId } = result;

    if (lectureId) {
      console.log('\n🔍 Monitoring processing status...');
      
      // Poll status endpoint
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`http://localhost:3000/api/vtt/status/${lectureId}`, {
          headers: {
            // Add authentication headers here
            // 'Authorization': 'Bearer your-jwt-token'
          }
        });
        
        const statusResult = await statusResponse.json();
        
        console.log(`📈 Status check ${attempts + 1}:`, {
          status: statusResult.status,
          stage: statusResult.processingStage,
          progress: statusResult.progress,
          chunksCount: statusResult.stats?.chunksCount
        });
        
        if (statusResult.status === 'completed') {
          console.log('\n🎉 Processing completed successfully!');
          console.log('📊 Final stats:', statusResult.stats);
          break;
        } else if (statusResult.status === 'failed') {
          console.log('\n❌ Processing failed:', statusResult.error);
          break;
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log('\n⏰ Processing timeout - check status manually');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n✅ VTT upload test completed!');
  console.log('\n📝 To run this test:');
  console.log('1. Start the Next.js server: npm run dev');
  console.log('2. Set up authentication (login or use test token)');
  console.log('3. Update cohortId and moduleId with real values');
  console.log('4. Run: tsx scripts/test-vtt-upload.ts');
}

main().catch(console.error);
