import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig, { markdownPreprocess } from './mdsvex.config.js';

const OUTPUT_DIR = 'target/build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],

  preprocess: [markdownPreprocess, vitePreprocess(), mdsvex(mdsvexConfig)],

  kit: {
    adapter: adapter({
      pages: OUTPUT_DIR,
      assets: OUTPUT_DIR,
      fallback: '404.html',
    }),

    prerender: {
      // [slug] returns empty entries until M2 adds real posts
      handleUnseenRoutes: 'ignore',
    },

    paths: {
      relative: false,
    },
    alias: {
      $widgets: 'src/widgets',
      $features: 'src/features',
      $shared: 'src/shared',
      $entities: 'src/entities',
      $content: 'content',
      $mdsvex: 'config/mdsvex',
    },
  },
};

export default config;
