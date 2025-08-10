/**
 * Jest Configuration for E-invoicing Module Tests
 */

module.exports = {
  displayName: 'E-invoicing Module',
  testMatch: [
    '<rootDir>/src/services/einvoicing/**/*.test.{ts,tsx}',
    '<rootDir>/src/components/einvoicing/**/*.test.{ts,tsx}',
    '<rootDir>/src/hooks/**/useEInvoicing.test.{ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/services/einvoicing/__tests__/setup.ts'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@einvoicing/(.*)$': '<rootDir>/src/services/einvoicing/$1'
  },
  coverageDirectory: '<rootDir>/coverage/einvoicing',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/services/einvoicing/**/*.{ts,tsx}',
    'src/components/einvoicing/**/*.{ts,tsx}',
    'src/hooks/useEInvoicing.{ts,tsx}',
    '!src/services/einvoicing/**/*.d.ts',
    '!src/services/einvoicing/**/*.test.{ts,tsx}',
    '!src/services/einvoicing/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/einvoicing/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};