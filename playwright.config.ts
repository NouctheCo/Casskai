import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.test
dotenv.config({ path: '.env.test' });

/**
 * Playwright E2E Testing Configuration
 * Documentation: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Timeout global pour chaque test */
  timeout: 90000, // 90 secondes par test (au lieu de 30s par défaut)

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1, // 1 retry même en local

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 3, // Seulement 3 workers au lieu de 11

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for testing */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://casskai.app',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment for multi-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
