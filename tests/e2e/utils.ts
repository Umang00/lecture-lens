/**
 * Test Utilities
 * Common functions and helpers for E2E tests
 */

import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  cohort: string;
}

export const testUsers: Record<string, TestUser> = {
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

/**
 * Login as a specific user
 */
export async function loginAs(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
  await page.click('[data-testid="sign-out-button"]');
  await page.waitForURL('/login');
}

/**
 * Ask a question in the chat interface
 */
export async function askQuestion(page: Page, question: string) {
  await page.fill('[data-testid="chat-input"] textarea', question);
  await page.click('[data-testid="send-button"]');
}

/**
 * Wait for chat response
 */
export async function waitForChatResponse(page: Page, timeout = 10000) {
  // Wait for loading to start
  await expect(page.locator('text=Thinking...')).toBeVisible();
  
  // Wait for loading to finish
  await expect(page.locator('text=Thinking...')).not.toBeVisible({ timeout });
  
  // Wait for response to appear
  await expect(page.locator('[data-testid="message-list"]')).toContainText(/Docker|volumes|container/i);
}

/**
 * Clear chat history
 */
export async function clearChatHistory(page: Page) {
  await page.click('[data-testid="clear-history-button"]');
  await page.click('text=OK');
  await expect(page.locator('text=Welcome to Lecture Lens!')).toBeVisible();
}

/**
 * Upload a VTT file
 */
export async function uploadVTTFile(page: Page, filePath: string, metadata: {
  title: string;
  instructor: string;
  date: string;
  cohort: string;
  module: string;
}) {
  await page.goto('/admin/upload');
  
  await page.fill('[data-testid="lecture-title"]', metadata.title);
  await page.fill('[data-testid="instructor-name"]', metadata.instructor);
  await page.fill('[data-testid="lecture-date"]', metadata.date);
  await page.selectOption('[data-testid="cohort-select"]', metadata.cohort);
  await page.selectOption('[data-testid="module-select"]', metadata.module);
  
  const fileInput = page.locator('[data-testid="vtt-file-input"]');
  await fileInput.setInputFiles(filePath);
  
  await page.click('[data-testid="upload-submit"]');
}

/**
 * Add a resource
 */
export async function addResource(page: Page, resource: {
  type: string;
  url: string;
  title?: string;
}) {
  await page.click('[data-testid="add-resource-button"]');
  
  await page.selectOption('[data-testid="resource-type"]', resource.type);
  await page.fill('[data-testid="resource-url"]', resource.url);
  
  if (resource.title) {
    await page.fill('[data-testid="resource-title"]', resource.title);
  }
  
  await page.click('[data-testid="add-resource-submit"]');
}

/**
 * Check if user has access to admin features
 */
export async function checkAdminAccess(page: Page, shouldHaveAccess: boolean) {
  if (shouldHaveAccess) {
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
  } else {
    await expect(page.locator('[data-testid="admin-nav"]')).not.toBeVisible();
  }
}

/**
 * Check if user has access to instructor features
 */
export async function checkInstructorAccess(page: Page, shouldHaveAccess: boolean) {
  if (shouldHaveAccess) {
    await expect(page.locator('[data-testid="instructor-nav"]')).toBeVisible();
  } else {
    await expect(page.locator('[data-testid="instructor-nav"]')).not.toBeVisible();
  }
}

/**
 * Verify chat interface is working
 */
export async function verifyChatInterface(page: Page) {
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
}

/**
 * Verify responsive design
 */
export async function verifyResponsiveDesign(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  
  // Chat interface should still be visible and functional
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  
  // Test mobile interaction
  await page.fill('[data-testid="chat-input"] textarea', 'Mobile test');
  await page.click('[data-testid="send-button"]');
}

/**
 * Simulate network error
 */
export async function simulateNetworkError(page: Page, urlPattern: string) {
  await page.route(urlPattern, route => route.abort());
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page, urlPattern: string, delay: number = 5000) {
  await page.route(urlPattern, route => {
    setTimeout(() => route.continue(), delay);
  });
}

/**
 * Wait for processing to complete
 */
export async function waitForProcessing(page: Page, timeout = 60000) {
  await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();
  await expect(page.locator('text=Processing complete')).toBeVisible({ timeout });
}

/**
 * Check for error messages
 */
export async function checkForErrors(page: Page) {
  // Check for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}
