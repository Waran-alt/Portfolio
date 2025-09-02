import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Base configuration for all files
    ignores: [
      '.yarn/',
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '*.min.js',
      '*.bundle.js',
      'Dockerfile*',
      'docker-compose*.yml',
      '.env*',
      '*.log',
      'public/',
      'out/',
      // Ignore compiled output from workspaces
      'apps/backend/dist/',
      'apps/frontend/.next/',
      'packages/shared/dist/',
      // Ignore specific config files at the root of workspaces
      'apps/frontend/tailwind.config.ts',
      'apps/frontend/postcss.config.js',
      'apps/frontend/next.config.js',
      'apps/frontend/jest.config.js'
    ],
  },
  
  // Base JS/TS rules for the whole repo
  ...tseslint.configs.recommended,
  
  // Frontend-specific configuration
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    ...nextPlugin.configs.recommended,
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: './apps/frontend',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // Not needed in TypeScript projects
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
       'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },

  // Backend-specific configuration
   {
    files: ['apps/backend/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: './apps/backend',
      },
    },
    rules: {
       '@typescript-eslint/no-explicit-any': 'error',
    }
  },

  // Test file overrides
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 'any' is often needed in tests
    },
  },
); 