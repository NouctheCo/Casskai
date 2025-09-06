// @ts-nocheck
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Create auth directory if it doesn't exist
  const fs = await import('fs');
  const path = await import('path');
  
  const authDir = path.resolve('.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Launch browser for auth setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Base URL from config
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
    
    // Navigate to login page
    await page.goto(`${baseURL}/auth`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're already logged in by looking for dashboard elements
    const isDashboard = await page.locator('[data-testid="dashboard"]').count() > 0;
    
    if (!isDashboard) {
      // Fill in test credentials
      await page.fill('[data-testid="email-input"]', 'test@casskai.app');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      
      // Submit the form
      await page.click('[data-testid="login-button"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Save authentication state
    await page.context().storageState({ path: '.auth/user.json' });
    
    console.log('✅ Authentication state saved');
    
  } catch (error) {
    console.warn('⚠️ Could not set up authentication state:', error.message);
    
    // Create a basic auth file for tests to continue
    fs.writeFileSync('.auth/user.json', JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: config.projects[0]?.use?.baseURL || 'http://localhost:5173',
          localStorage: [
            {
              name: 'test-user',
              value: 'authenticated'
            }
          ]
        }
      ]
    }));
  } finally {
    await browser.close();
  }
  
  console.log('🎯 Global setup completed');
}

export default globalSetup;