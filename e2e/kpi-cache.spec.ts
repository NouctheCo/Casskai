import { test, expect } from '@playwright/test';
import { dismissOverlays } from './testUtils/dismissOverlays';

test('dev kpi cache page shows cache and recomputed JSON', async ({ page }) => {
  // Navigate to the dev page and ensure overlays are dismissed
  await page.goto('/dev/kpi-cache');
  await dismissOverlays(page);

  const companyId = '3321651c-1298-4611-8883-9cbf81c1227d';

  // Fill company id and fetch cache
  await page.fill('input[placeholder="company id"]', companyId);
  await page.click('text=Fetch Cache');

  // First pre is the Cache, second pre is the Recomputed (server)
  const cachePre = page.locator('pre').nth(0);
  const serverPre = page.locator('pre').nth(1);

  // Ensure the cache pre has some text (may be "null" or JSON)
  const cacheText = await cachePre.innerText();
  expect(cacheText.length).toBeGreaterThan(0);

  // Fetch recomputed KPIs from server and assert server pre shows some text
  await page.click('text=Fetch Recomputed KPIs');

  // Wait for the server pre to be populated (allow network latency)
  await expect(serverPre).toHaveText(/.*/s, { timeout: 10000 });
  const serverText = await serverPre.innerText();
  expect(serverText.length).toBeGreaterThan(0);
});
