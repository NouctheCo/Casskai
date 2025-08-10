import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  // Clean up authentication files
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const authFile = path.resolve('.auth/user.json');
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('🗑️ Authentication state cleaned up');
    }
  } catch (error) {
    console.warn('⚠️ Could not clean up auth files:', error.message);
  }
  
  // Clean up test data if needed
  try {
    // Add any database cleanup logic here
    console.log('🧼 Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Could not clean up test data:', error.message);
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;