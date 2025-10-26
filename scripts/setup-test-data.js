#!/usr/bin/env node

/**
 * Test Data Setup Script
 * Sets up test data for E2E tests using Supabase MCP
 */

const { createClient } = require('@supabase/supabase-js');

// Test data configuration
const testData = {
  cohorts: [
    {
      id: 'cohort-5',
      name: 'Cohort 5',
      start_date: '2024-01-15'
    },
    {
      id: 'cohort-6', 
      name: 'Cohort 6',
      start_date: '2024-02-01'
    }
  ],
  
  modules: [
    {
      id: 'module-1',
      cohort_id: 'cohort-5',
      name: 'Module 1: Introduction',
      sequence: 1
    },
    {
      id: 'module-2',
      cohort_id: 'cohort-5', 
      name: 'Module 2: Containerization',
      sequence: 2
    }
  ],
  
  users: [
    {
      email: 'student@cohort5.com',
      password: 'demo123',
      role: 'student',
      cohort_id: 'cohort-5'
    },
    {
      email: 'instructor@cohort5.com',
      password: 'demo123', 
      role: 'instructor',
      cohort_id: 'cohort-5'
    },
    {
      email: 'admin@100x.com',
      password: 'demo123',
      role: 'admin',
      cohort_id: null // Admin has access to all cohorts
    }
  ],
  
  sampleLectures: [
    {
      id: 'lecture-1',
      title: 'Docker Deep Dive',
      instructor: 'Siddhanth',
      lecture_date: '2024-02-15',
      module_id: 'module-2',
      cohort_id: 'cohort-5',
      duration_mins: 120,
      processed: true,
      status: 'completed'
    }
  ],
  
  sampleResources: [
    {
      id: 'resource-1',
      title: 'Docker Compose Documentation',
      url: 'https://github.com/docker/compose',
      type: 'github',
      is_global: false
    },
    {
      id: 'resource-2',
      title: 'Docker Best Practices',
      url: 'https://docs.docker.com/develop/best-practices/',
      type: 'blog',
      is_global: true
    }
  ]
};

async function setupTestData() {
  console.log('🔧 Setting up test data for E2E tests...\n');
  
  // Note: In a real implementation, you would use Supabase MCP here
  // For now, we'll just log what would be created
  
  console.log('📊 Test Data Summary:');
  console.log(`  - ${testData.cohorts.length} cohorts`);
  console.log(`  - ${testData.modules.length} modules`);
  console.log(`  - ${testData.users.length} users`);
  console.log(`  - ${testData.sampleLectures.length} sample lectures`);
  console.log(`  - ${testData.sampleResources.length} sample resources\n`);
  
  console.log('👥 Test Users:');
  testData.users.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  
  console.log('\n📚 Sample Content:');
  testData.sampleLectures.forEach(lecture => {
    console.log(`  - ${lecture.title} by ${lecture.instructor}`);
  });
  
  testData.sampleResources.forEach(resource => {
    console.log(`  - ${resource.title} (${resource.type})`);
  });
  
  console.log('\n✅ Test data setup complete!');
  console.log('\n📝 Note: This is a mock setup. In a real implementation,');
  console.log('   you would use Supabase MCP to create actual test data.');
}

// Run setup if called directly
if (require.main === module) {
  setupTestData().catch(console.error);
}

module.exports = { setupTestData, testData };
