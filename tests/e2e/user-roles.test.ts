/**
 * End-to-End Tests for User Roles
 * Tests the application from the perspective of different user types:
 * - Student: Can access chat interface, ask questions, view sources
 * - Admin: Can upload lectures, manage resources, access all cohorts
 * - Instructor: Can add resources, view student queries, manage content
 */

import { test, expect } from '@playwright/test';

// Test data for different user roles
const testUsers = {
  student: {
    email: 'student@cohort5.com',
    password: 'demo123',
    role: 'student',
    cohort: 'Cohort 5'
  },
  instructor: {
    email: 'instructor@cohort5.com', 
    password: 'demo123',
    role: 'instructor',
    cohort: 'Cohort 5'
  },
  admin: {
    email: 'admin@100x.com',
    password: 'demo123', 
    role: 'admin',
    cohort: 'All Cohorts'
  }
};

// Sample test data
const sampleLecture = {
  title: 'Docker Deep Dive',
  instructor: 'Siddhanth',
  date: '2024-02-15',
  module: 'Module 2: Containerization'
};

const sampleResource = {
  type: 'GitHub',
  url: 'https://github.com/docker/compose',
  title: 'Docker Compose Documentation'
};

test.describe('User Role Testing', () => {
  
  test.describe('Student User Flow', () => {
    test('should allow student to login and access chat interface', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should see chat interface
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      
      // Should see welcome message
      await expect(page.locator('text=Welcome to Lecture Lens!')).toBeVisible();
    });

    test('should allow student to ask questions and receive responses', async ({ page }) => {
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Ask a question
      const chatInput = page.locator('[data-testid="chat-input"] textarea');
      await chatInput.fill('How do Docker volumes work?');
      await page.click('[data-testid="send-button"]');
      
      // Should show loading state
      await expect(page.locator('text=Thinking...')).toBeVisible();
      
      // Should show response (mock or real depending on setup)
      await expect(page.locator('[data-testid="message-list"]')).toContainText('Docker volumes');
      
      // Should show sources if available
      await expect(page.locator('[data-testid="source-card"]')).toBeVisible();
    });

    test('should maintain conversation history', async ({ page }) => {
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Ask first question
      await page.fill('[data-testid="chat-input"] textarea', 'What is Docker?');
      await page.click('[data-testid="send-button"]');
      await page.waitForSelector('[data-testid="message-list"]');
      
      // Ask follow-up question
      await page.fill('[data-testid="chat-input"] textarea', 'How do volumes work?');
      await page.click('[data-testid="send-button"]');
      
      // Should maintain context
      await expect(page.locator('[data-testid="message-list"]')).toContainText('What is Docker?');
      await expect(page.locator('[data-testid="message-list"]')).toContainText('How do volumes work?');
    });

    test('should allow clearing chat history', async ({ page }) => {
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Ask a question
      await page.fill('[data-testid="chat-input"] textarea', 'Test question');
      await page.click('[data-testid="send-button"]');
      await page.waitForSelector('[data-testid="message-list"]');
      
      // Clear history
      await page.click('[data-testid="clear-history-button"]');
      
      // Confirm dialog
      await page.click('text=OK');
      
      // Should show welcome message again
      await expect(page.locator('text=Welcome to Lecture Lens!')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Chat interface should be visible and functional
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      
      // Test mobile chat input
      await page.fill('[data-testid="chat-input"] textarea', 'Mobile test');
      await page.click('[data-testid="send-button"]');
    });
  });

  test.describe('Admin User Flow', () => {
    test('should allow admin to access upload interface', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.admin.email);
      await page.fill('[data-testid="password-input"]', testUsers.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Admin should see upload interface or navigation to it
      await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
      
      // Navigate to upload page
      await page.click('[data-testid="upload-lecture-button"]');
      await expect(page).toHaveURL('/admin/upload');
    });

    test('should allow admin to upload VTT files', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.admin.email);
      await page.fill('[data-testid="password-input"]', testUsers.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      await page.click('[data-testid="upload-lecture-button"]');
      
      // Fill upload form
      await page.fill('[data-testid="lecture-title"]', sampleLecture.title);
      await page.fill('[data-testid="instructor-name"]', sampleLecture.instructor);
      await page.fill('[data-testid="lecture-date"]', sampleLecture.date);
      
      // Select cohort and module
      await page.selectOption('[data-testid="cohort-select"]', 'Cohort 5');
      await page.selectOption('[data-testid="module-select"]', 'Module 2');
      
      // Upload VTT file
      const fileInput = page.locator('[data-testid="vtt-file-input"]');
      await fileInput.setInputFiles('test-data/sample-lecture.vtt');
      
      // Submit form
      await page.click('[data-testid="upload-submit"]');
      
      // Should show processing status
      await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();
    });

    test('should allow admin to add resources', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.admin.email);
      await page.fill('[data-testid="password-input"]', testUsers.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Navigate to resources
      await page.click('[data-testid="manage-resources-button"]');
      
      // Add new resource
      await page.click('[data-testid="add-resource-button"]');
      
      // Fill resource form
      await page.selectOption('[data-testid="resource-type"]', sampleResource.type);
      await page.fill('[data-testid="resource-url"]', sampleResource.url);
      await page.fill('[data-testid="resource-title"]', sampleResource.title);
      
      // Submit resource
      await page.click('[data-testid="add-resource-submit"]');
      
      // Should show success message
      await expect(page.locator('text=Resource added successfully')).toBeVisible();
    });

    test('should allow admin to view all cohorts', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.admin.email);
      await page.fill('[data-testid="password-input"]', testUsers.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Admin should see cohort selector
      await expect(page.locator('[data-testid="cohort-selector"]')).toBeVisible();
      
      // Should be able to switch between cohorts
      await page.selectOption('[data-testid="cohort-selector"]', 'Cohort 5');
      await page.selectOption('[data-testid="cohort-selector"]', 'Cohort 6');
    });
  });

  test.describe('Instructor User Flow', () => {
    test('should allow instructor to access chat and add resources', async ({ page }) => {
      // Login as instructor
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.instructor.email);
      await page.fill('[data-testid="password-input"]', testUsers.instructor.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Should see chat interface
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      
      // Should see instructor-specific features
      await expect(page.locator('[data-testid="instructor-nav"]')).toBeVisible();
    });

    test('should allow instructor to add resources during lecture', async ({ page }) => {
      // Login as instructor
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.instructor.email);
      await page.fill('[data-testid="password-input"]', testUsers.instructor.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Navigate to add resource
      await page.click('[data-testid="add-resource-button"]');
      
      // Add GitHub resource
      await page.selectOption('[data-testid="resource-type"]', 'GitHub');
      await page.fill('[data-testid="resource-url"]', 'https://github.com/docker/compose');
      
      // Submit
      await page.click('[data-testid="add-resource-submit"]');
      
      // Should show processing
      await expect(page.locator('text=Processing resource...')).toBeVisible();
    });

    test('should allow instructor to view student queries', async ({ page }) => {
      // Login as instructor
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.instructor.email);
      await page.fill('[data-testid="password-input"]', testUsers.instructor.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Should see analytics or query history
      await expect(page.locator('[data-testid="query-analytics"]')).toBeVisible();
    });
  });

  test.describe('Cross-Role Testing', () => {
    test('should enforce role-based access control', async ({ page }) => {
      // Try to access admin features as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Student should not see admin features
      await expect(page.locator('[data-testid="admin-nav"]')).not.toBeVisible();
      
      // Try to access admin URL directly
      await page.goto('/admin/upload');
      
      // Should be redirected or show access denied
      await expect(page).not.toHaveURL('/admin/upload');
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      // Login as any user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test('should handle logout properly', async ({ page }) => {
      // Login as any user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Logout
      await page.click('[data-testid="sign-out-button"]');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Simulate network failure
      await page.route('**/api/query', route => route.abort());
      
      // Try to ask a question
      await page.fill('[data-testid="chat-input"] textarea', 'Test question');
      await page.click('[data-testid="send-button"]');
      
      // Should show error message
      await expect(page.locator('text=Sorry, I encountered an error')).toBeVisible();
    });

    test('should handle API timeouts', async ({ page }) => {
      // Login as student
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.student.email);
      await page.fill('[data-testid="password-input"]', testUsers.student.password);
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('/dashboard');
      
      // Simulate slow API response
      await page.route('**/api/query', route => {
        setTimeout(() => route.continue(), 10000);
      });
      
      // Try to ask a question
      await page.fill('[data-testid="chat-input"] textarea', 'Test question');
      await page.click('[data-testid="send-button"]');
      
      // Should show loading state
      await expect(page.locator('text=Thinking...')).toBeVisible();
    });
  });
});
