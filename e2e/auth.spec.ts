import { test, expect } from '@playwright/test';

import { dismissOverlays } from './testUtils/dismissOverlays';

const RUN_AUTHED_E2E =
  process.env.PLAYWRIGHT_RUN_AUTHED_E2E === '1' || process.env.PLAYWRIGHT_RUN_AUTHED_E2E === 'true';

/**
 * E2E Tests - Authentication Flow
 * Critical user journey: Login → Dashboard
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL || '');
    test.skip(
      /casskai\.app/i.test(baseURL) && !process.env.PLAYWRIGHT_ALLOW_PROD,
      'Refusing to run E2E against production without PLAYWRIGHT_ALLOW_PROD=1'
    );

    // Navigate to app
    await page.goto('/login');
    await dismissOverlays(page);
  });

  test('should display login page', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/CassKai/);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Dismiss any overlays that might be blocking
    await dismissOverlays(page);

    // Ensure the "Connexion" tab is active (it should be by default, but click to be safe)
    const signinTab = page.getByRole('tab', { name: /connexion/i });
    if (await signinTab.isVisible().catch(() => false)) {
      await signinTab.click();
    }

    // Wait for form to be loaded - use multiple selectors for robustness
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"], [aria-label*="email" i]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"], [aria-label*="mot de passe" i], [aria-label*="password" i]').first();
    const submitButton = page.getByRole('button', { name: /se connecter|connexion|login/i });

    // Check login form elements are visible with increased timeout for CI
    await expect(emailInput).toBeVisible({ timeout: 30000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    test.skip(
      !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY,
      'Supabase env not configured for E2E (.env.test.local)'
    );

    // Wait for page to fully load and dismiss overlays
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Ensure the "Connexion" tab is active
    const signinTab = page.getByRole('tab', { name: /connexion/i });
    if (await signinTab.isVisible().catch(() => false)) {
      await signinTab.click();
    }

    // Fill invalid credentials using robust selectors
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).click();

    // The UI may show an inline error or a toast. The stable assertion is: user stays on login.
    await expect(page).toHaveURL(/\/login/i, { timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    test.skip(
      !RUN_AUTHED_E2E,
      'Authenticated E2E disabled by default; set PLAYWRIGHT_RUN_AUTHED_E2E=1'
    );

    // Note: This test requires test credentials in .env.test
    const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test.local'
    );

    // Wait for page to fully load and dismiss overlays
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Ensure the "Connexion" tab is active
    const signinTab = page.getByRole('tab', { name: /connexion/i });
    if (await signinTab.isVisible().catch(() => false)) {
      await signinTab.click();
    }

    // Fill credentials using robust selectors
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard|accueil/i, { timeout: 10000 });

    // Check dashboard loaded
    await expect(page.getByText(/dashboard|tableau de bord/i)).toBeVisible();
  });

  test('should navigate to password reset', async ({ page }) => {
    // Click forgot password link
    await dismissOverlays(page);

    const resetLink = page.getByRole('link', { name: /forgot|oublié|mot de passe/i });
    const hasResetLink = await resetLink.isVisible().catch(() => false);
    if (!hasResetLink) {
      test.skip(true, 'Password reset link not available on this login page');
    }

    await resetLink.click();

    // Check password reset form using robust selectors
    const emailInput = page.locator('input[type="email"], [aria-label*="email" i]').first();
    await expect(emailInput).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|réinitialiser/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    test.skip(
      !RUN_AUTHED_E2E,
      'Authenticated E2E disabled by default; set PLAYWRIGHT_RUN_AUTHED_E2E=1'
    );

    // Note: This test requires authentication
    const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test.local'
    );

    // Wait for page to fully load and dismiss overlays
    await page.waitForLoadState('networkidle');
    await dismissOverlays(page);

    // Ensure the "Connexion" tab is active
    const signinTab = page.getByRole('tab', { name: /connexion/i });
    if (await signinTab.isVisible().catch(() => false)) {
      await signinTab.click();
    }

    // Login first using robust selectors
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).click();
    await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });

    // Find and click logout button (usually in user menu)
    await page.getByRole('button', { name: /menu|profile|utilisateur/i }).click();
    await page.getByRole('menuitem', { name: /logout|déconnexion/i }).click();

    // Check redirected to login
    await expect(page).toHaveURL(/login|connexion/i, { timeout: 5000 });
  });
});
