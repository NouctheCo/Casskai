import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load env files similar to playwright.config.ts
dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.PLAYWRIGHT_LOCAL_BASE_URL || 'http://localhost:5173';

  // Launch a headless browser to set localStorage / click cookie banner once.
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(baseURL, { waitUntil: 'load', timeout: 60000 });

    // Try to set the cookie preferences in localStorage so the banner is hidden.
    try {
      await page.evaluate(() => {
        // Key used by app for cookie preferences
        // analytics: false to avoid analytics calls during tests
        localStorage.setItem('casskai_cookie_preferences', JSON.stringify({ analytics: false, functional: true }));
      });
    } catch (e) {
      // ignore
    }

    // If the banner still shows, try clicking the accept/decline buttons.
    try {
      const accept = page.locator('text=Tout accepter');
      if (await accept.count()) await accept.click({ timeout: 2000 });
    } catch (e) {
      // ignore
    }
    try {
      const decline = page.locator('text=Tout refuser');
      if (await decline.count()) await decline.click({ timeout: 2000 });
    } catch (e) {
      // ignore
    }

    // Give app a short moment to persist state
    await page.waitForTimeout(500);
  } catch (err) {
    // Non-fatal: tests can still run; log for visibility
     
    console.warn('global-setup: cookie seeding failed', err);
  } finally {
    await browser.close();
  }
}
