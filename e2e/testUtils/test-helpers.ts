/**
 * CassKai E2E Test Helpers
 * Shared utilities for authenticated E2E tests
 */

import type { Page, BrowserContext } from '@playwright/test';
import { dismissOverlays } from './dismissOverlays';

interface AuthHelpers {
  login: (email: string, password: string) => Promise<void>;
}

interface TestHelpers {
  auth: AuthHelpers;
  cleanup: () => Promise<void>;
}

export const testUtils = {
  /**
   * Setup test helpers with page and context
   * Returns auth helpers and cleanup function
   */
  setup(page: Page, _context: BrowserContext): TestHelpers {
    return {
      auth: {
        async login(email: string, password: string): Promise<void> {
          const testEmail = email || process.env.TEST_USER_EMAIL || 'test@casskai.app';
          const testPassword = password || process.env.TEST_USER_PASSWORD || 'Test123456az';

          await page.goto('/login');
          await dismissOverlays(page);

          await page.getByLabel(/email/i).fill(testEmail);
          await page.getByLabel(/mot de passe|password/i).fill(testPassword);
          await page.getByRole('button', { name: /sign in|se connecter|connexion/i }).click();
          await page.waitForURL(/dashboard|accueil/i, { timeout: 15000 });

          // Dismiss any post-login overlays
          await dismissOverlays(page);
        },
      },
      async cleanup(): Promise<void> {
        // Clear any test state if needed
        try {
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
        } catch {
          // Page may already be closed
        }
      },
    };
  },
};
