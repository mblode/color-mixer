import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['node_modules/**', 'dist/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...(tseslint.configs.recommended?.rules ?? {}),
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'off',
    },
  },
]
