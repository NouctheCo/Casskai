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

  /* Timeout global pour chaque test - augmenté pour CI/CD */
  timeout: 120000, // 2 minutes par test (au lieu de 90s)

  /* Timeout pour les expect - augmenté pour les pages lentes */
  expect: {
    timeout: 10000, // 10 secondes pour les assertions (au lieu de 5s par défaut)
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only - augmenté à 3 retries pour tests flaky */
  retries: process.env.CI ? 3 : 1,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 3, // 1 seul worker sur CI pour éviter surcharge

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

    /* Augmenter les timeouts pour les actions */
    actionTimeout: 15000, // 15 secondes pour les clics, inputs, etc.
    navigationTimeout: 30000, // 30 secondes pour les navigations

    /* Ignorer les erreurs HTTPS en dev */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Plus de temps pour les pages lentes */
        launchOptions: {
          slowMo: process.env.CI ? 100 : 0, // Ralentir de 100ms sur CI
        },
      },
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
    timeout: 180 * 1000, // 3 minutes pour démarrer le serveur (au lieu de 2)
    stdout: 'pipe', // Afficher les logs du serveur
    stderr: 'pipe',
  },
});
