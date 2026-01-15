import { test, expect } from '@playwright/test';

import { dismissOverlays } from './testUtils/dismissOverlays';

const RUN_AUTHED_E2E =
  process.env.PLAYWRIGHT_RUN_AUTHED_E2E === '1' || process.env.PLAYWRIGHT_RUN_AUTHED_E2E === 'true';

/**
 * E2E Tests - Onboarding Flow
 * Critical user journey: Signup → Company Setup → First Dashboard View
 */

test.describe('Onboarding', () => {
  test.beforeEach(async ({}, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL || '');
    test.skip(
      /casskai\.app/i.test(baseURL) && !process.env.PLAYWRIGHT_ALLOW_PROD,
      'Refusing to run E2E against production without PLAYWRIGHT_ALLOW_PROD=1'
    );

    test.skip(
      !RUN_AUTHED_E2E,
      'Authenticated E2E disabled by default; set PLAYWRIGHT_RUN_AUTHED_E2E=1'
    );

    test.skip(
      !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY,
      'Supabase env not configured for E2E (.env.test.local)'
    );
  });

  test('should complete signup flow', async ({ page }) => {
    await page.goto('/signup');
    await dismissOverlays(page);

    // Generate unique email for test
    const testEmail = `test-${Date.now()}@casskai.test`;

    // Fill signup form
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe|password/i).first().fill('TestPassword123!');

    // Confirm password field (if exists)
    const confirmPassword = page.getByLabel(/confirm|confirmer/i);
    if (await confirmPassword.isVisible().catch(() => false)) {
      await confirmPassword.fill('TestPassword123!');
    }

    // Accept terms (if checkbox exists)
    const termsCheckbox = page.getByLabel(/terms|conditions/i);
    if (await termsCheckbox.isVisible().catch(() => false)) {
      await termsCheckbox.check();
    }

    // Submit signup
    await page.getByRole('button', { name: /sign up|créer compte|inscription/i }).click();

    // Wait for redirect (either email verification or onboarding)
    await page.waitForURL(/verify|onboarding|setup/i, { timeout: 10000 });
  });

  test('should display onboarding wizard', async ({ page }) => {
    // Note: This assumes user is logged in but hasn't completed onboarding
    await page.goto('/onboarding');
    await dismissOverlays(page);

    // Check wizard is visible
    await expect(page.getByText(/welcome|bienvenue|setup|configuration/i)).toBeVisible();

    // Check for steps indicator
    const stepsIndicator = page.getByRole('list', { name: /steps|étapes/i }).or(
      page.locator('[role="progressbar"]')
    );
    await expect(stepsIndicator).toBeVisible();
  });

  test('should complete company setup step', async ({ page }) => {
    await page.goto('/onboarding');
    await dismissOverlays(page);

    // Fill company information
    const companyName = `Test Company ${Date.now()}`;

    await page.getByLabel(/company name|nom entreprise|raison sociale/i).fill(companyName);

    // Fill SIRET/Registration number if exists
    const siretInput = page.getByLabel(/siret|registration|numéro/i);
    if (await siretInput.isVisible().catch(() => false)) {
      await siretInput.fill('12345678900000');
    }

    // Fill address if exists
    const addressInput = page.getByLabel(/address|adresse/i);
    if (await addressInput.isVisible().catch(() => false)) {
      await addressInput.fill('123 Test Street, Dakar');
    }

    // Click next/continue button
    await page.getByRole('button', { name: /next|continue|suivant|continuer/i }).click();

    // Wait for next step or completion
    await page.waitForLoadState('networkidle');
  });

  test('should select business plan', async ({ page }) => {
    await page.goto('/onboarding');
    await dismissOverlays(page);

    // Navigate through steps if needed
    const nextButton = page.getByRole('button', { name: /next|suivant/i });
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
    }

    // Look for plan selection
    const planCards = page.getByRole('button', { name: /free|gratuit|essential|essentiel/i });

    if (await planCards.first().isVisible().catch(() => false)) {
      // Select first available plan (Free/Gratuit)
      await planCards.first().click();

      // Confirm selection
      const confirmButton = page.getByRole('button', { name: /confirm|select|choisir|confirmer/i });
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
    }
  });

  test('should configure accounting settings', async ({ page }) => {
    await page.goto('/onboarding');

    // Navigate to accounting setup step
    // This might be step 3 or 4 depending on flow

    // Select fiscal year start
    const fiscalYearSelect = page.getByLabel(/fiscal year|exercice fiscal|début exercice/i);
    if (await fiscalYearSelect.isVisible().catch(() => false)) {
      await fiscalYearSelect.click();
      await page.getByRole('option').first().click();
    }

    // Select currency
    const currencySelect = page.getByLabel(/currency|devise|monnaie/i);
    if (await currencySelect.isVisible().catch(() => false)) {
      await currencySelect.click();
      await page.getByRole('option', { name: /XOF|CFA/i }).click();
    }

    // Select chart of accounts
    const chartSelect = page.getByLabel(/chart of accounts|plan comptable/i);
    if (await chartSelect.isVisible().catch(() => false)) {
      await chartSelect.click();
      await page.getByRole('option').first().click();
    }
  });

  test('should complete onboarding and redirect to dashboard', async ({ page }) => {
    await page.goto('/onboarding');

    // Fill all required steps quickly
    // Step 1: Company
    const companyNameInput = page.getByLabel(/company name|nom entreprise/i);
    if (await companyNameInput.isVisible().catch(() => false)) {
      await companyNameInput.fill(`Test Company ${Date.now()}`);
      await page.getByRole('button', { name: /next|suivant/i }).click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Plan selection
    const freePlan = page.getByRole('button', { name: /free|gratuit/i });
    if (await freePlan.isVisible().catch(() => false)) {
      await freePlan.click();
      await page.getByRole('button', { name: /next|suivant|confirm/i }).click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Accounting
    const currencySelect = page.getByLabel(/currency|devise/i);
    if (await currencySelect.isVisible().catch(() => false)) {
      await currencySelect.click();
      await page.getByRole('option').first().click();
    }

    // Click finish button
    const finishButton = page.getByRole('button', { name: /finish|complete|terminer|commencer/i });
    if (await finishButton.isVisible().catch(() => false)) {
      await finishButton.click();
    }

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard|accueil/i, { timeout: 15000 });

    // Check dashboard loaded
    await expect(page.getByText(/dashboard|tableau de bord|welcome|bienvenue/i)).toBeVisible();
  });

  test('should skip onboarding if already completed', async ({ page }) => {
    // Login with user who has completed onboarding
    const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe|password/i).fill(testPassword);
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).click();

    // Should redirect directly to dashboard (not onboarding)
    await expect(page).toHaveURL(/dashboard|accueil/i, { timeout: 10000 });
    expect(page.url()).not.toContain('onboarding');
  });
});
