// @ts-nocheck
import { test, expect } from '@playwright/test';

// Minimal smoke to verify app boots and dashboard route renders

test('smoke: dashboard route responds', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toBeVisible();
});

// Verify offline indicator appears when switching offline

test('smoke: offline indicator toggles', async ({ page, context }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');

  await context.setOffline(true);
  await page.waitForTimeout(300);
  await expect(page.getByTestId('offline-indicator')).toBeVisible();

  await context.setOffline(false);
});
