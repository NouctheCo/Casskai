/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/integration-setup.ts'],
    include: [
      'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
      'src/test/**/*.integration.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: ['node_modules', 'dist', '.next', '.vercel'],
    
    // Integration tests typically need more time
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Run integration tests sequentially to avoid database conflicts
    threads: false,
    
    // Separate coverage for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'tailwind.config.*',
        'postcss.config.*',
        'vite.config.*',
      ],
    },
    
    // Environment variables for integration tests
    env: {
      NODE_ENV: 'test',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    
    // Retry failed tests
    retry: 2,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});