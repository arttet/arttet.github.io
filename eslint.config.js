import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

export default [
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      'svelte/no-at-html-tags': 'error',
      'svelte/no-navigation-without-resolve': 'error',
      'svelte/no-target-blank': 'error',
      'svelte/require-each-key': 'error',
      'svelte/valid-compile': 'error',
    },
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      'brace-style': ['error', '1tbs'],
      'max-statements-per-line': ['error', { max: 1 }],
    },
  },
  {
    ignores: [
      '.svelte-kit/',
      'content/**',
      'docs/.vitepress/cache/',
      'docs/.vitepress/dist/',
      'node_modules/',
      'target/',
      'tests/playwright/**-snapshots/',
    ],
  },
];
