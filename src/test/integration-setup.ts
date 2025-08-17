import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { getSupabaseTestClient } from './supabaseTestClient';

// Setup real Supabase connection for integration tests via singleton client

// Database cleanup utilities
export const cleanupDatabase = async () => {
  try {
    // Only clean up test data to avoid affecting real data
    const supabase = getSupabaseTestClient();
    
    // Clean up test enterprises
    await supabase
      .from('enterprises')
      .delete()
      .like('name', 'Test %');
    
    // Clean up test users if needed
    await supabase
      .from('user_profiles')
      .delete()
      .like('email', '%@test.example');
    
  console.warn('✅ Database cleanup completed');
  } catch (_error) {
    console.warn('⚠️  Database cleanup failed:', _error);
  }
};

// Create test data utilities
export const createTestUser = async () => {
  const supabase = getSupabaseTestClient();
  
  const testUser = {
    id: `test-user-${  Math.random().toString(36).substr(2, 9)}`,
    email: `test${Date.now()}@test.example`,
    full_name: 'Test User',
    created_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([testUser])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  return data;
};

export const createTestEnterprise = async (userId: string) => {
  const supabase = getSupabaseTestClient();
  
  const testEnterprise = {
    id: `test-enterprise-${  Math.random().toString(36).substr(2, 9)}`,
    name: `Test Enterprise ${Date.now()}`,
    siret: '12345678901234',
    legal_form: 'SARL',
    sector: 'technology',
    currency: 'EUR',
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('enterprises')
    .insert([testEnterprise])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test enterprise: ${error.message}`);
  }
  
  return data;
};

// Wait for Supabase to be ready
export const waitForSupabase = async (timeout = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
  const supabase = getSupabaseTestClient();
      
      const { error } = await supabase.from('enterprises').select('id').limit(1);
      if (!error) {
      console.warn('✅ Supabase connection established');
        return true;
      }
  } catch (_error) {
      // Continue waiting
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Supabase connection timeout');
};

// Global setup
beforeAll(async () => {
    console.warn('🚀 Starting integration tests setup...');
  
  // Wait for Supabase to be ready
  try {
    await waitForSupabase();
  } catch (_error) {
    console.warn('⚠️  Supabase not available, some tests may fail');
  }
  
  // Setup global mocks that shouldn't interfere with real API calls
  global.fetch = global.fetch || vi.fn();
  
  // Mock console to reduce noise in tests
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Hook useEffect') ||
       args[0].includes('Warning: componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn(...args);
  };
});

// Global teardown
afterAll(async () => {
    console.warn('🧹 Cleaning up after integration tests...');
  await cleanupDatabase();
});

// Per-test setup
beforeEach(() => {
  // Reset any mocks between tests
  vi.clearAllMocks();
});

// Per-test cleanup
afterEach(async () => {
  // Clean up any test data created during the test
  // This is more granular than the global cleanup
  vi.clearAllTimers();
});

// Mock browser APIs that might not be available in test environment
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});