// @ts-nocheck
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', '.vercel', 'src/**/*.integration.*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Exclude generated/config files
        'tailwind.config.*',
        'postcss.config.*',
        'vite.config.*',
        // Exclude types and interfaces
        'src/types/',
        // Exclude mock data and test files
        'src/**/*.mock.*',
        'src/**/*.stories.*',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    // Watch options
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    // Pool options for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});