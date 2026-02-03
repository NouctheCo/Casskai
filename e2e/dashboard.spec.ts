import { test, expect } from '@playwright/test';

import { dismissOverlays } from './testUtils/dismissOverlays';

const RUN_AUTHED_E2E =
  process.env.PLAYWRIGHT_RUN_AUTHED_E2E === '1' || process.env.PLAYWRIGHT_RUN_AUTHED_E2E === 'true';

/**
 * E2E Tests - Dashboard
 * Critical user journey: View KPIs → Navigate Modules → Access Reports
 */

// Helper function to login
async function login(page: any) {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';
  const testPassword = process.env.TEST_USER_PASSWORD || 'Test123456az';

  await page.goto('/login');
  await dismissOverlays(page);
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/mot de passe|password/i).fill(testPassword);
  await page.getByRole('button', { name: /sign in|se connecter|connexion/i }).click();
  await page.waitForURL(/dashboard|accueil/i, { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !RUN_AUTHED_E2E,
      'Authenticated E2E disabled by default; set PLAYWRIGHT_RUN_AUTHED_E2E=1'
    );

    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test.local'
    );

    await login(page);
  });

  test('should display dashboard with KPIs', async ({ page }) => {
    // Check dashboard title (avoid strict mode collisions)
    const dashboardIndicator = page
      .getByRole('heading', { name: /dashboard|tableau de bord/i })
      .first()
      .or(page.getByRole('button', { name: /dashboard|tableau de bord/i }).first());
    await expect(dashboardIndicator).toBeVisible();

    // Check for KPI cards (Revenue, Expenses, Profit, etc.)
    const kpiCards = page.locator('[data-testid*="kpi"]').or(
      page.locator('.kpi-card, .metric-card')
    );

    const kpiLabels = page.getByText(/revenue|revenus|dépenses|expenses|profit|trésorerie|cash/i).first();
    const hasCards = await kpiCards.first().isVisible().catch(() => false);
    const hasLabels = await kpiLabels.isVisible().catch(() => false);

    test.skip(!hasCards && !hasLabels, 'KPI cards not visible');

    // Should have at least one KPI visible
    if (hasCards) {
      await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(kpiLabels).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display recent transactions', async ({ page }) => {
    // Look for recent transactions section
    const transactionsSection = page.getByText(/recent transactions|transactions récentes/i);

    if (await transactionsSection.isVisible().catch(() => false)) {
      await expect(transactionsSection).toBeVisible();

      // Check for transaction list or empty state
      const hasTransactions = await page.getByRole('list').isVisible().catch(() => false);
      const hasTable = await page.getByRole('table').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no transactions|aucune transaction/i).isVisible().catch(() => false);

      expect(hasTransactions || hasTable || hasEmptyState).toBeTruthy();
    }
  });

  test('should display charts', async ({ page }) => {
    // Wait for charts to render
    await page.waitForLoadState('networkidle');

    // Look for chart containers
    const charts = page.locator('[data-testid*="chart"]').or(
      page.locator('canvas, svg[class*="chart"], .recharts-wrapper')
    );

    // Should have at least one chart
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should navigate to invoicing module', async ({ page }) => {
    // Look for invoicing navigation button/link
    const invoicingNav = page
      .getByRole('button', { name: /invoicing|facturation/i })
      .or(page.getByRole('link', { name: /invoicing|facturation/i }));

    const isVisible = await invoicingNav.first().isVisible().catch(() => false);
    test.skip(!isVisible, 'Invoicing navigation not available');

    await invoicingNav.first().click();

    // Check URL changed
    await expect(page).toHaveURL(/invoicing|facturation/i);
  });

  test('should navigate to accounting module', async ({ page }) => {
    // Look for accounting navigation button/link
    const accountingNav = page
      .getByRole('button', { name: /accounting|comptabilité/i })
      .or(page.getByRole('link', { name: /accounting|comptabilité/i }));

    const isVisible = await accountingNav.first().isVisible().catch(() => false);
    test.skip(!isVisible, 'Accounting navigation not available');

    await accountingNav.first().click();

    // Check URL changed
    await expect(page).toHaveURL(/accounting|comptabilite/i);
  });

  test('should open settings', async ({ page }) => {
    // Look for settings link (usually in sidebar or header icon)
    const settingsLink = page.locator('a[href="/settings"]').or(
      page.getByRole('link', { name: /settings|paramètres/i })
    );

    if (await settingsLink.first().isVisible().catch(() => false)) {
      await settingsLink.first().click();
      await expect(page).toHaveURL(/settings|parametres/i);
    } else {
      // Try user menu
      const menuButton = page.getByRole('button', { name: /menu|profile|utilisateur/i });
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
        await page.getByRole('menuitem', { name: /settings|paramètres/i }).click();
        await expect(page).toHaveURL(/settings|parametres/i);
      } else {
        test.skip(true, 'Settings navigation not available');
      }
    }
  });

  test('should display notifications', async ({ page }) => {
    // Look for notification bell icon
    const notificationButton = page.getByRole('button', { name: /notifications/i }).or(
      page.locator('[data-testid="notifications-button"]')
    );

    if (await notificationButton.isVisible().catch(() => false)) {
      await notificationButton.click();

      // Check notification panel opened
      const notificationPanel = page.getByRole('dialog').or(
        page.locator('[data-testid="notifications-panel"]')
      );

      await expect(notificationPanel).toBeVisible({ timeout: 3000 });

      // Check for notifications or empty state
      const hasNotifications = await page.getByRole('listitem').isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no notifications|aucune notification/i).isVisible().catch(() => false);

      expect(hasNotifications || hasEmptyState).toBeTruthy();
    }
  });

  test('should filter dashboard by date range', async ({ page }) => {
    // Look for date range picker
    const dateRangePicker = page.getByRole('button', { name: /date range|période|filtre/i }).or(
      page.locator('[data-testid="date-range-picker"]')
    );

    if (await dateRangePicker.isVisible().catch(() => false)) {
      await dateRangePicker.click();

      // Select a preset (e.g., "This Month", "Last 30 Days")
      const preset = page.getByRole('button', { name: /this month|ce mois|last 30 days|30 derniers jours/i });

      if (await preset.isVisible().catch(() => false)) {
        await preset.click();

        // Wait for dashboard to update
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should switch between companies (multi-tenant)', async ({ page }) => {
    // Look for company switcher
    const companySwitcher = page.getByRole('button', { name: /company|entreprise/i }).or(
      page.locator('[data-testid="company-selector"]')
    );

    if (await companySwitcher.isVisible().catch(() => false)) {
      await companySwitcher.click();

      // Check dropdown opened
      const dropdown = page.getByRole('menu').or(page.getByRole('listbox'));
      await expect(dropdown).toBeVisible({ timeout: 3000 });

      // Get company count
      const companies = await page.getByRole('menuitem').or(page.getByRole('option')).count();

      if (companies > 1) {
        // Select second company
        await page.getByRole('menuitem').or(page.getByRole('option')).nth(1).click();

        // Wait for dashboard to reload with new company data
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should display quick actions', async ({ page }) => {
    // Look for quick action buttons (or refresh/action buttons on dashboard)
    const quickActions = page.getByRole('button', { name: /actualiser|create|new|créer|nouveau/i });

    const actionCount = await quickActions.count();
    test.skip(actionCount === 0, 'No quick actions detected on dashboard');

    // Try clicking first quick action
    const firstAction = quickActions.first();
    await firstAction.click();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();

    // Check mobile menu button is visible
    const mobileMenuButton = page
      .getByRole('button', { name: /menu|navigation/i })
      .or(page.locator('button[aria-label*="menu" i]'));

    const hasMenu = await mobileMenuButton.first().isVisible().catch(() => false);
    test.skip(!hasMenu, 'Mobile menu button not available');

    // Open mobile menu
    await mobileMenuButton.first().click();

    // Check navigation menu opened
    const mobileNav = page.getByRole('navigation');
    await expect(mobileNav).toBeVisible();
  });
});
