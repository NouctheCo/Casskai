import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * Critical user journey: Login → Dashboard
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/CassKai/);

    // Check login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /connexion|login/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid|incorrect|erreur/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Note: This test requires test credentials in .env.test
    const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Fill credentials
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: /connexion|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard|accueil/i, { timeout: 10000 });

    // Check dashboard loaded
    await expect(page.getByText(/dashboard|tableau de bord/i)).toBeVisible();
  });

  test('should navigate to password reset', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /forgot|oublié|mot de passe/i }).click();

    // Check password reset form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|réinitialiser/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Note: This test requires authentication
    const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    // Login first
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /connexion|login/i }).click();
    await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });

    // Find and click logout button (usually in user menu)
    await page.getByRole('button', { name: /menu|profile|utilisateur/i }).click();
    await page.getByRole('menuitem', { name: /logout|déconnexion/i }).click();

    // Check redirected to login
    await expect(page).toHaveURL(/login|connexion/i, { timeout: 5000 });
  });
});
