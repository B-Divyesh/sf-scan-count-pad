import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', '.factory/qa-*.mjs'] },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'vite.config.ts', 'playwright.config.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      'no-undef': 'off',
    },
  },
);
