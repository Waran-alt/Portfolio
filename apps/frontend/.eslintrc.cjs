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
        // Relaxed: jsx-no-literals would require extracting 100+ strings to i18n/vars
        'react/jsx-no-literals': 'off',
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
    },
  ],
};


