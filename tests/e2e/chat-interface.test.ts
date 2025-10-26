/**
 * Chat Interface E2E Tests
 * Tests the core chat functionality for different user roles
 */

import { test, expect } from '@playwright/test';
import { loginAs, testUsers, askQuestion, waitForChatResponse, clearChatHistory, verifyChatInterface } from './utils';

test.describe('Chat Interface', () => {
  
  test.describe('Student User', () => {
    test('should be able to login and access chat interface', async ({ page }) => {
      await loginAs(page, testUsers.student);
      await verifyChatInterface(page);
      
      // Should see welcome message
      await expect(page.locator('text=Welcome to Lecture Lens!')).toBeVisible();
      await expect(page.locator('text=Ask me anything about your cohort')).toBeVisible();
    });

    test('should be able to ask questions', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Ask a question
      await askQuestion(page, 'How do Docker volumes work?');
      
      // Should show loading state
      await expect(page.locator('text=Thinking...')).toBeVisible();
      
      // Note: In a real test environment, you would wait for an actual response
      // For now, we'll just verify the loading state appears
    });

    test('should maintain conversation history', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Ask first question
      await askQuestion(page, 'What is Docker?');
      await page.waitForTimeout(1000); // Wait for message to appear
      
      // Ask follow-up question
      await askQuestion(page, 'How do volumes work?');
      await page.waitForTimeout(1000);
      
      // Should see both messages in history
      await expect(page.locator('[data-testid="message-list"]')).toContainText('What is Docker?');
      await expect(page.locator('[data-testid="message-list"]')).toContainText('How do volumes work?');
    });

    test('should be able to clear chat history', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Ask a question first
      await askQuestion(page, 'Test question');
      await page.waitForTimeout(1000);
      
      // Clear history
      await clearChatHistory(page);
      
      // Should see welcome message again
      await expect(page.locator('text=Welcome to Lecture Lens!')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAs(page, testUsers.student);
      await verifyChatInterface(page);
      
      // Test mobile chat input
      await askQuestion(page, 'Mobile test question');
    });
  });

  test.describe('Authentication', () => {
    test('should require authentication to access chat', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
      await verifyChatInterface(page);
    });

    test('should handle logout properly', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
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
    test('should handle network errors gracefully', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Simulate network failure
      await page.route('**/api/query', route => route.abort());
      
      // Try to ask a question
      await askQuestion(page, 'Test question');
      
      // Should show error message
      await expect(page.locator('text=Sorry, I encountered an error')).toBeVisible();
    });

    test('should handle API timeouts', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Simulate slow API response
      await page.route('**/api/query', route => {
        setTimeout(() => route.continue(), 10000);
      });
      
      // Try to ask a question
      await askQuestion(page, 'Test question');
      
      // Should show loading state
      await expect(page.locator('text=Thinking...')).toBeVisible();
    });
  });

  test.describe('UI Components', () => {
    test('should display all chat components correctly', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Check all main components are visible
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="clear-history-button"]')).toBeVisible();
    });

    test('should have proper input validation', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Try to send empty message
      await page.click('[data-testid="send-button"]');
      
      // Button should be disabled or nothing should happen
      await expect(page.locator('[data-testid="message-list"]')).not.toContainText('');
    });

    test('should show character count', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Type a long message
      const longMessage = 'A'.repeat(600);
      await page.fill('[data-testid="chat-input"] textarea', longMessage);
      
      // Should show character count
      await expect(page.locator('text=600/500')).toBeVisible();
    });

    test('should handle Enter key to send', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Type message and press Enter
      await page.fill('[data-testid="chat-input"] textarea', 'Test message');
      await page.press('[data-testid="chat-input"] textarea', 'Enter');
      
      // Should send the message
      await expect(page.locator('[data-testid="message-list"]')).toContainText('Test message');
    });

    test('should handle Shift+Enter for new line', async ({ page }) => {
      await loginAs(page, testUsers.student);
      
      // Type message with Shift+Enter
      await page.fill('[data-testid="chat-input"] textarea', 'Line 1');
      await page.press('[data-testid="chat-input"] textarea', 'Shift+Enter');
      await page.type('[data-testid="chat-input"] textarea', 'Line 2');
      
      // Should not send yet
      await expect(page.locator('[data-testid="message-list"]')).not.toContainText('Line 1');
    });
  });
});
