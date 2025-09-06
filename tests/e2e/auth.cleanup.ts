// @ts-nocheck
import { test as cleanup } from '@playwright/test';
import { unlink } from 'fs/promises';

cleanup('remove auth file', async () => {
  try {
    await unlink('.auth/user.json');
    console.log('🧹 Authentication file removed');
  } catch (error) {
    console.log('ℹ️ No auth file to remove or error:', error.message);
  }
});