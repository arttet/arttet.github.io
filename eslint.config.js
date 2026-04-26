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
      'svelte/no-target-blank': 'error',
      'svelte/valid-compile': 'error',
      // Stylistic — defer to a follow-up Svelte best-practices PR.
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'off',
    },
  },
  {
    ignores: [
      'target/',
      '.svelte-kit/',
      'node_modules/',
      'src/content/**',
      'tests/playwright/**-snapshots/',
    ],
  },
];
