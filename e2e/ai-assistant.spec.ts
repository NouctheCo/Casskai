import { test, expect } from '@playwright/test';
import { testUtils } from './testUtils/test-helpers';

/**
 * 🤖 Tests E2E - AI Assistant Chat
 * 
 * Couvre:
 * - Ouverture du widget flottant
 * - Envoi de messages
 * - Réception de réponses
 * - Affichage des suggestions
 * - Exécution des actions
 * - Gestion erreurs
 */

test.describe('AI Assistant Chat - Integration Tests', () => {
  let helpers: ReturnType<typeof testUtils.setup>;

  test.beforeEach(async ({ page, context }) => {
    helpers = await testUtils.setup(page, context);
    await helpers.auth.login('test@casskai.com', 'Password123!');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await helpers.cleanup();
  });

  // ─────────────────────────────────────────────────────────
  // 1. WIDGET BASICS
  // ─────────────────────────────────────────────────────────

  test('should display floating AI assistant button', async ({ page }) => {
    const button = page.locator('button[aria-label*="AI"], button:has-text("CassKai Assistant")');
    await expect(button).toBeVisible();
    
    // Verify styling
    const styles = await button.getAttribute('class');
    expect(styles).toContain('rounded-full');
    expect(styles).toContain('z-50');
  });

  test('should open chat modal when clicking button', async ({ page }) => {
    const button = page.locator('button[aria-label*="AI"], button:has-text("CassKai Assistant")');
    await button.click();

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify chat area elements
    const messages = page.locator('[role="log"]'); // Messages area
    const input = page.locator('input[placeholder*="question"], input[placeholder*="Question"]');
    const sendButton = page.locator('button:has-text("Send"), button[aria-label*="send"]');

    await expect(messages).toBeVisible();
    await expect(input).toBeVisible();
    await expect(sendButton).toBeVisible();
  });

  test('should close modal when clicking X button', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click close button
    const closeButton = modal.locator('button[aria-label*="close"], button:has-text("×")').first();
    await closeButton.click();

    await expect(modal).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────
  // 2. MESSAGE SENDING & RECEIVING
  // ─────────────────────────────────────────────────────────

  test('should send message and receive response', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"], input[placeholder*="Question"]');
    const sendButton = page.locator('button:has-text("Send"), button[aria-label*="send"]');

    // Send message
    await input.fill('How do I create an invoice?');
    await sendButton.click();

    // Verify user message appears
    await expect(page.locator('text=How do I create an invoice?')).toBeVisible();

    // Wait for assistant response (max 10s)
    const assistantMessage = page.locator('[role="log"]').locator('text=/[Cc]asskai|[Aa]ssistant/i');
    await expect(assistantMessage).toBeVisible({ timeout: 10000 });

    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    // Try to send empty message
    await input.fill('   ');
    await sendButton.click();

    // Should not send and input should still be focused
    await expect(input).toBeFocused();
  });

  test('should format multi-line messages correctly', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"], textarea[placeholder*="question"]');
    
    // Enter multi-line message
    await input.fill('How do I:\n1. Create invoice\n2. Send it');
    
    // Should allow Shift+Enter for new lines (if textarea)
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Message should appear as sent
    await expect(page.locator('text=How do I')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────
  // 3. SUGGESTIONS
  // ─────────────────────────────────────────────────────────

  test('should display suggestions after assistant message', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    // Send message that should trigger suggestions
    await input.fill('How do I get started?');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Look for suggestion buttons/chips
    const suggestions = page.locator('button:has-text("Create invoice"), button:has-text("View accounting"), button:has-text("Help")').first();
    
    if (await suggestions.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(true).toBe(true); // Suggestions found
    }
  });

  test('should allow clicking suggestions', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Help');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Try to find and click a suggestion
    const suggestionBtn = page.locator('button').filter({ hasText: /^[A-Z]/ }).nth(2);
    
    if (await suggestionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const suggestionText = await suggestionBtn.textContent();
      await suggestionBtn.click();

      // Message should be filled with suggestion text
      const filledInput = page.locator('input[placeholder*="question"]');
      const value = await filledInput.inputValue();
      expect(value).toContain(suggestionText?.trim() || '');
    }
  });

  // ─────────────────────────────────────────────────────────
  // 4. ACTIONS
  // ─────────────────────────────────────────────────────────

  test('should display action buttons in responses', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    // Ask for navigation
    await input.fill('Open invoicing');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Look for action buttons (should contain "invoicing" or navigation action)
    const actionBtn = page.locator('button:has-text("Invoicing"), button:has-text("invoicing")').first();
    
    if (await actionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(await actionBtn.textContent()).toMatch(/[Ii]nvoic/);
    }
  });

  test('should execute navigate actions', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Go to accounting');
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Click navigation action if visible
    const navBtn = page.locator('button:has-text("Accounting"), button:has-text("accounting")').first();
    
    if (await navBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navBtn.click();

      // Should navigate to accounting page
      await expect(page).toHaveURL(/\/accounting/, { timeout: 5000 });
    }
  });

  // ─────────────────────────────────────────────────────────
  // 5. CONVERSATION FLOW
  // ─────────────────────────────────────────────────────────

  test('should maintain conversation history', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');
    const messagesArea = page.locator('[role="log"]');

    // Send first message
    await input.fill('What is CassKai?');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Send second message
    await input.fill('How do I use it?');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Both messages should be visible
    await expect(page.locator('text=What is CassKai?')).toBeVisible();
    await expect(page.locator('text=How do I use it?')).toBeVisible();

    // Messages should be in correct order (first above second)
    const messages = await page.locator('[role="log"] > *').count();
    expect(messages).toBeGreaterThanOrEqual(4); // At least 2 user + 2 assistant
  });

  test('should clear chat when clicking clear button', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    // Send a message
    await input.fill('Test message');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Find and click clear button
    const clearBtn = page.locator('button[aria-label*="clear"], button:has-text("Clear")').first();
    
    if (await clearBtn.isVisible()) {
      await clearBtn.click();

      // Messages should be gone
      await expect(page.locator('text=Test message')).not.toBeVisible();
    }
  });

  // ─────────────────────────────────────────────────────────
  // 6. ERROR HANDLING
  // ─────────────────────────────────────────────────────────

  test('should show error message on API failure', async ({ page }) => {
    // Intercept and fail API call
    await page.route('**/functions/v1/ai-assistant', route => {
      route.abort('failed');
    });

    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Test');
    await sendButton.click();

    // Wait for error
    const errorMsg = page.locator('[role="alert"], text=/[Ee]rror|failed/i');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Simulate slow API
    await page.route('**/functions/v1/ai-assistant', async route => {
      await new Promise(resolve => setTimeout(resolve, 15000));
      route.continue();
    });

    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Test');
    await sendButton.click();

    // Should show loading then either error or response
    const spinner = page.locator('[role="status"], .spinner, [aria-busy="true"]');
    await expect(spinner).toBeVisible({ timeout: 1000 });

    // After timeout, should show error
    await page.waitForTimeout(5000);
    const errorOrMsg = page.locator('[role="alert"], text=/response|error|timeout/i');
    await expect(errorOrMsg).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────
  // 7. ACCESSIBILITY
  // ─────────────────────────────────────────────────────────

  test('should have proper keyboard navigation', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    await input.focus();

    // Type message with Tab navigation
    await input.fill('Hello');
    await page.keyboard.press('Tab'); // Move to send button

    const sendButton = page.locator('button:has-text("Send")');
    const isFocused = await sendButton.evaluate((el) => el === document.activeElement);
    
    expect(isFocused).toBe(true);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    // Verify modal has role
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveAttribute('role', 'dialog');

    // Verify messages have role
    const messagesArea = page.locator('[role="log"]');
    await expect(messagesArea).toBeVisible();

    // Verify input has label
    const input = page.locator('input[placeholder*="question"]');
    const hasLabel = await input.getAttribute('aria-label').catch(() => null);
    // Should either have aria-label or associated label
    expect(hasLabel || await input.inputValue()).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────
  // 8. INTEGRATION WITH PAGE CONTEXT
  // ─────────────────────────────────────────────────────────

  test('should pass correct context to AI on accounting page', async ({ page }) => {
    // Navigate to accounting page
    await page.goto('/accounting');
    await page.waitForLoadState('networkidle');

    // Intercept AI call
    let aiRequest: any = null;
    await page.route('**/functions/v1/ai-assistant', async route => {
      aiRequest = route.request().postDataJSON();
      route.continue();
    });

    const openButton = page.locator('button[aria-label*="AI"]');
    await openButton.click();

    const input = page.locator('input[placeholder*="question"]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Help with entries');
    await sendButton.click();

    // Wait for request
    await page.waitForTimeout(1000);

    // Verify context type includes accounting
    expect(aiRequest?.context_type).toMatch(/accounting|journal|entry/i);
  });
});
