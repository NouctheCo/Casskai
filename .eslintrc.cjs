module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react-refresh', '@typescript-eslint', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    
    // ========================================
    // 🔥 TYPESCRIPT STRICT RULES - SPRINT 0
    // ========================================
    
    // Interdire 'any' explicite (CRITICAL)
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Warn 'any' implicite
    '@typescript-eslint/no-implicit-any': 'warn',
    
    // Typage retour fonctions obligatoire
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }],
    
    // Interdire @ts-ignore (utiliser @ts-expect-error)
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-ignore': true,
      'ts-expect-error': 'allow-with-description'
    }],
    
    // Variables inutilisées
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Pas de console.log en production
    'no-console': ['warn', {
      allow: ['warn', 'error', 'info']
    }],
    
    // Comparaisons strictes
    'eqeqeq': ['error', 'always'],
    
    // Interdire var (utiliser const/let)
    'no-var': 'error',
    
    // Préférer const
    'prefer-const': 'error',
    
    // Pas de code mort
    'no-unreachable': 'error',
    'no-dead-code': 'error',
    
    // React best practices
    'react/prop-types': 'off', // TypeScript gère déjà
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
