module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        // Disallow raw string literals in JSX children
        // Allow strings in props (aria-*, title, data-*, etc.) for practicality
        'react/jsx-no-literals': [
          'warn',
          { noStrings: true, ignoreProps: true },
        ],
        // Next.js / React 17+ does not require React in scope
        'react/react-in-jsx-scope': 'off',
        // Allow styled-jsx <style jsx> usage
        'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
      },
    },
    {
      files: [
        '**/*.{test,spec}.{ts,tsx,js,jsx}',
        '**/*.stories.{ts,tsx,js,jsx}',
      ],
      rules: {
        'react/jsx-no-literals': 'off',
      },
    },
  ],
};


