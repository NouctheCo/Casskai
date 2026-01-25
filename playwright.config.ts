import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement pour les tests E2E.
// (Les secrets ne doivent pas être commités; voir .env.example)
dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const LOCAL_BASE_URL = process.env.PLAYWRIGHT_LOCAL_BASE_URL || 'http://localhost:5173';

// Allow overriding the baseURL (e.g. CI running against a deployed environment), but require an explicit opt-in
// when a developer has a remote URL in their local env file.
const REMOTE_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL;
const USE_REMOTE_BASE_URL =
  !!REMOTE_BASE_URL &&
  (process.env.CI === 'true' ||
    process.env.CI === '1' ||
    process.env.PLAYWRIGHT_USE_REMOTE === 'true' ||
    process.env.PLAYWRIGHT_USE_REMOTE === '1');

const BASE_URL = USE_REMOTE_BASE_URL ? REMOTE_BASE_URL! : LOCAL_BASE_URL;

/**
 * Playwright E2E Testing Configuration
 * Documentation: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup script to pre-seed browser state (cookie consent) before tests run
  globalSetup: './e2e/global-setup.ts',

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
    // Avoid keeping a local HTML report server running (which can hang local/CI runs).
    // Developers can still open the report manually via `npx playwright show-report`.
    ['html', { open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for testing */
    baseURL: BASE_URL,

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
  webServer: USE_REMOTE_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000, // 3 minutes pour démarrer le serveur (au lieu de 2)
        stdout: 'pipe', // Afficher les logs du serveur
        stderr: 'pipe',
      },
});
