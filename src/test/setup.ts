import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi, afterEach, beforeAll, afterAll } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
  setTimeout(cb, 0);
  return 1;
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn();

// Mock crypto.randomUUID for Open Banking tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234-5678-9012'),
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(16)),
  },
});

// Mock URL.createObjectURL for file operations
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Environment variables for tests
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Console warnings can be noisy in tests, so we suppress them
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => {
  const first = args[0];
  if (typeof first === 'string') {
    if (
      first.includes('React Hook useEffect') ||
      first.includes('React Router Future Flag Warning') ||
  first.includes('Multiple GoTrueClient instances') ||
  first.includes('not wrapped in act(') ||
  first.includes('should be wrapped in act(') ||
  first.includes('wrap-tests-with-act')
    ) {
      return;
    }
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const first = args[0];
  if (typeof first === 'string') {
    if (
      first.includes('Async submission failed:') ||
      first.includes('Error fetching document:') ||
  first.includes('Error updating document status:') ||
  first.includes('not wrapped in act(') ||
  first.includes('should be wrapped in act(') ||
  first.includes('wrap-tests-with-act')
    ) {
      return;
    }
  }
  originalError(...args);
};

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Ensure DOM is cleaned between tests
afterEach(() => {
  cleanup();
});