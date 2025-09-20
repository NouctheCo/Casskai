import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

export default [
  // Ignore patterns
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      '.next/**/*',
      'build/**/*',
      'public/**/*',
      '**/*.d.ts',
      'supabase/functions/**/*',
      'tests/e2e/test-results/**/*',
      'playwright-report/**/*',
    ]
  },

  // TypeScript/TSX files configuration (main app files)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json', // Pointez vers le tsconfig racine
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
    },
    rules: {
      // ... la section 'rules' reste exactement la même qu'avant ...
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
        }
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',
      'import/no-unresolved': 'off', // Trop lourd, TypeScript gère déjà ça
      'import/no-useless-path-segments': 'warn',
      'import/extensions': 'off', // TypeScript gère les extensions
      'import/no-self-import': 'error',
      'import/no-cycle': 'off', // Trop lourd pour le développement
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 700],
      'max-lines-per-function': ['warn', 100],
      'max-params': ['warn', 5],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-await-in-loop': 'warn',
      'require-atomic-updates': 'error',
      
      // Enforce TypeScript-only in src directory
      '@typescript-eslint/no-require-imports': 'error',
      
      // File naming enforced manually during code reviews
      // Prefer camelCase for components, PascalCase for React components
      
      // Additional code style rules
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
    },
  },

  // Forbid .jsx files in src directory
  {
    files: ['src/**/*.jsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: '*',
          message: 'JSX files are not allowed in src directory. Use .tsx files instead for TypeScript safety.',
        },
      ],
    },
  },

  // JavaScript files configuration (config files, scripts, etc.)
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['src/**/*.{js,jsx}'], // Only non-src JS files
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Extend recommended configs
      ...js.configs.recommended.rules,

      // General code quality rules
      'no-console': 'off', // Allow console in config files
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      
      // Import/Export rules
      'no-duplicate-imports': 'error',
      
      // Complexity rules
      'complexity': ['warn', 20], // More lenient for config files
      'max-depth': ['warn', 5],
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off',

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // Test files specific configuration
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/tests/**/*.{js,jsx,ts,tsx}', 'src/test/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.app.json',
      },
      globals: {
        ...globals.jest,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      // Allow more flexible rules in tests
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // Specific utils TSX that isn't part of TS project graph (avoid parserOptions.project error)
  {
    files: ['src/utils/animationOptimization.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: null,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Keep sensible rules, but avoid type-aware only checks here
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // E2E (Playwright) tests: disable type-aware parsing to avoid tsconfig project issues
  {
    files: ['tests/e2e/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Use non-type-aware linting for e2e specs
        project: null,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // Configuration files
  {
    files: ['**/*.config.{js,ts}', '**/*.setup.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Scripts directory
  {
    files: ['scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]