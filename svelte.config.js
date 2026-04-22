import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import { mathPreprocess } from './src/lib/math-preprocessor.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],

  // mathPreprocess must run BEFORE mdsvex so backslashes in LaTeX are preserved
  preprocess: [mathPreprocess(), vitePreprocess(), mdsvex(mdsvexConfig)],

  kit: {
    adapter: adapter({
      pages: 'target/build',
      assets: 'target/build',
      fallback: '404.html',
    }),

    prerender: {
      // [slug] returns empty entries until M2 adds real posts
      handleUnseenRoutes: 'ignore',
    },

    alias: {
      $widgets: 'src/widgets',
      $features: 'src/features',
      $shared: 'src/shared',
      $entities: 'src/entities',
    },
  },
};

export default config;
