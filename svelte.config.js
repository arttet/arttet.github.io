import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import { mathPreprocess } from './src/lib/math-preprocessor.js';

const OUTPUT_DIR = 'target/build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],

  preprocess: [
    // Compatibility layer. Must run before mdsvex to preserve LaTeX backslashes
    // and current CodeTabs behavior.
    // TODO(sprint-7): move this logic into config/mdsvex steps and remove it.
    mathPreprocess(),
    vitePreprocess(),
    mdsvex(mdsvexConfig),
  ],

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
    },
  },
};

export default config;
