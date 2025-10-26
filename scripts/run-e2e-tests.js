#!/usr/bin/env node

/**
 * E2E Test Execution Script
 * This script can be used with Playwright MCP to run specific test scenarios
 */

const { execSync } = require('child_process');
const path = require('path');

// Test scenarios that can be executed
const testScenarios = {
  'student-login': {
    description: 'Test student login and chat access',
    command: 'npx playwright test tests/e2e/chat-interface.test.ts -g "Student User"'
  },
  'admin-upload': {
    description: 'Test admin upload functionality',
    command: 'npx playwright test tests/e2e/user-roles.test.ts -g "Admin User Flow"'
  },
  'instructor-resources': {
    description: 'Test instructor resource management',
    command: 'npx playwright test tests/e2e/user-roles.test.ts -g "Instructor User Flow"'
  },
  'authentication': {
    description: 'Test authentication flows',
    command: 'npx playwright test tests/e2e/chat-interface.test.ts -g "Authentication"'
  },
  'error-handling': {
    description: 'Test error handling scenarios',
    command: 'npx playwright test tests/e2e/chat-interface.test.ts -g "Error Handling"'
  },
  'mobile-responsive': {
    description: 'Test mobile responsiveness',
    command: 'npx playwright test tests/e2e/chat-interface.test.ts -g "responsive"'
  },
  'all-chat-tests': {
    description: 'Run all chat interface tests',
    command: 'npx playwright test tests/e2e/chat-interface.test.ts'
  },
  'all-role-tests': {
    description: 'Run all user role tests',
    command: 'npx playwright test tests/e2e/user-roles.test.ts'
  },
  'full-suite': {
    description: 'Run complete test suite',
    command: 'npx playwright test'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const scenario = args[0] || 'help';
const options = args.slice(1);

// Available options
const availableOptions = {
  '--headed': 'Run tests in headed mode (show browser)',
  '--debug': 'Run tests in debug mode',
  '--ui': 'Run tests with UI mode',
  '--project=chromium': 'Run tests only on Chromium',
  '--project=firefox': 'Run tests only on Firefox',
  '--project=webkit': 'Run tests only on WebKit',
  '--project=Mobile Chrome': 'Run tests only on Mobile Chrome',
  '--project=Mobile Safari': 'Run tests only on Mobile Safari'
};

function showHelp() {
  console.log('🎭 Playwright E2E Test Runner\n');
  console.log('Usage: node scripts/run-e2e-tests.js <scenario> [options]\n');
  
  console.log('Available Scenarios:');
  Object.entries(testScenarios).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(20)} - ${value.description}`);
  });
  
  console.log('\nAvailable Options:');
  Object.entries(availableOptions).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(20)} - ${value}`);
  });
  
  console.log('\nExamples:');
  console.log('  node scripts/run-e2e-tests.js student-login');
  console.log('  node scripts/run-e2e-tests.js admin-upload --headed');
  console.log('  node scripts/run-e2e-tests.js full-suite --project=chromium');
  console.log('  node scripts/run-e2e-tests.js authentication --debug');
}

function runTest(scenario, options) {
  if (!testScenarios[scenario]) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    showHelp();
    process.exit(1);
  }

  const testConfig = testScenarios[scenario];
  const command = `${testConfig.command} ${options.join(' ')}`;
  
  console.log(`🚀 Running test scenario: ${scenario}`);
  console.log(`📝 Description: ${testConfig.description}`);
  console.log(`⚡ Command: ${command}\n`);
  
  try {
    // Change to project directory
    process.chdir(path.join(__dirname, '..'));
    
    // Execute the command
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`\n✅ Test scenario '${scenario}' completed successfully!`);
  } catch (error) {
    console.error(`\n❌ Test scenario '${scenario}' failed!`);
    console.error('Exit code:', error.status);
    process.exit(1);
  }
}

// Main execution
if (scenario === 'help' || scenario === '--help' || scenario === '-h') {
  showHelp();
} else {
  runTest(scenario, options);
}
