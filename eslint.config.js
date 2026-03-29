import globals from 'globals';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist', '.pw-user-data', '.cache-synpress'] },
  // Node.js JavaScript files (config files, scripts).
  {
    files: ['scripts/**/*.js', 'tailwind.config.js', 'postcss.config.js', 'vite.config.ts', 'playwright.config.ts', 'tests/wallet-setup/**/*.setup.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'space-before-function-paren': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  // Other JavaScript files.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['scripts/**/*.js', 'tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'space-before-function-paren': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  // TypeScript files.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        jsx: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
      'no-unused-imports': 'off',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'space-before-function-paren': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
];
