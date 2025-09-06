// @ts-nocheck
import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('/auth');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check if we have login form
  const hasLoginForm = await page.locator('[data-testid="login-form"]').count() > 0;
  
  if (hasLoginForm) {
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@casskai.app');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    
    // Click login button
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login (navigation to dashboard or success indicator)
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    console.log('✅ User authenticated successfully');
  } else {
    console.log('ℹ️ User already authenticated or auth form not found');
  }

  // Save authentication state to reuse in other tests
  await page.context().storageState({ path: authFile });
});