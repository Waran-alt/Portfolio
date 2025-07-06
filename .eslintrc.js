module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier', // Disable ESLint rules that conflict with Prettier
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // TypeScript specific rules (preferred over general ESLint rules)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-explicit-any': 'error', // Stricter typing
    '@typescript-eslint/explicit-function-return-type': 'warn', // Encourage explicit types
    '@typescript-eslint/explicit-module-boundary-types': 'warn', // Encourage explicit types
    
    // General code quality (only rules not covered by TypeScript plugin)
    'no-debugger': 'error',
    
    // TypeScript-aware alternatives to general ESLint rules
    '@typescript-eslint/no-dupe-imports': 'error', // Handles type imports correctly
    '@typescript-eslint/no-unused-expressions': 'error', // Handles TypeScript expressions
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Console handling - will be overridden per environment
    'no-console': 'warn',
  },
  overrides: [
    // Frontend specific rules (Next.js)
    {
      files: ['apps/frontend/**/*.{js,jsx,ts,tsx}'],
      env: {
        browser: true,
        es2022: true,
      },
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'next',
        'next/core-web-vitals',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        // React/Next.js specific rules
        'react/prop-types': 'off', // Not needed with TypeScript
        'react/react-in-jsx-scope': 'off', // Not needed with Next.js 12+ / React 17+ JSX transform
        'react/jsx-uses-react': 'off', // Not needed with new JSX transform
        'react/jsx-uses-vars': 'error',
        'react/jsx-key': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/no-array-index-key': 'warn',
        'react/no-danger': 'warn',
        'react/no-deprecated': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/no-unsafe': 'warn',
        'react/self-closing-comp': 'error',
        'react/sort-comp': 'off', // Can be too restrictive
        'react/void-dom-elements-no-children': 'error',
        
        // React Hooks rules
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        
        // Accessibility rules
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        
        // Console handling for frontend
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        '@typescript-eslint/no-explicit-any': 'warn', // Allow some flexibility in frontend
      },
    },
    // Backend specific rules (Node.js)
    {
      files: ['apps/backend/**/*.{js,ts}'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off', // Allow console in backend for logging
        '@typescript-eslint/no-explicit-any': 'error', // Strict typing for backend
        '@typescript-eslint/explicit-function-return-type': 'error', // Explicit types for API
        '@typescript-eslint/explicit-module-boundary-types': 'error', // Explicit types for modules
      },
    },
    // Shared packages
    {
      files: ['packages/**/*.{js,ts}'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'warn', // Warn about console in shared utilities
        '@typescript-eslint/no-explicit-any': 'error', // Strict typing for shared code
        '@typescript-eslint/explicit-function-return-type': 'error', // Explicit types for shared APIs
        '@typescript-eslint/explicit-module-boundary-types': 'error', // Explicit types for shared modules
      },
    },
    // Configuration files - differentiated by complexity
    {
      files: ['*.config.js', '*.config.mjs', '*.config.cjs'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off', // Allow console for debugging config loading
        '@typescript-eslint/no-var-requires': 'off', // Allow require() in JS configs
        '@typescript-eslint/explicit-function-return-type': 'off', // Relax typing for simple JS configs
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // TypeScript configuration files - maintain some strictness
    {
      files: ['*.config.ts'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off', // Allow console for debugging config loading
        '@typescript-eslint/no-var-requires': 'off', // Allow require() if needed
        '@typescript-eslint/explicit-function-return-type': 'warn', // Encourage types in TS configs
        '@typescript-eslint/explicit-module-boundary-types': 'warn', // Encourage types for exports
        '@typescript-eslint/no-explicit-any': 'warn', // Warn about any in TS configs
      },
    },
    // Test files
    {
      files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-console': 'off', // Allow console in tests
        '@typescript-eslint/no-explicit-any': 'warn', // Allow some flexibility in tests
        '@typescript-eslint/explicit-function-return-type': 'off', // Relax typing in tests
        '@typescript-eslint/explicit-module-boundary-types': 'off', // Relax typing in tests
      },
    },
  ],
  ignorePatterns: [
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
  ],
}; 