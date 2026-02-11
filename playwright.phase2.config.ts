/**
 * Playwright Configuration - Phase 2 Tests
 * Tests E2E spécifiques aux fonctionnalités Phase 2
 *
 * Usage:
 * npx playwright test --config playwright.phase2.config.ts
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e/phase2',
  testMatch: '**/*.spec.ts',

  // Timeout tests
  timeout: 60000, // 60s par test
  expect: {
    timeout: 10000, // 10s pour assertions
  },

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,

  // Retry on failure
  retries: process.env.CI ? 2 : 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report-phase2', open: 'never' }],
    ['json', { outputFile: 'playwright-results-phase2.json' }],
    ['list'],
  ],

  // Shared settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Contexte
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  // Projects (devices à tester)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Dev server (si tests locaux)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
