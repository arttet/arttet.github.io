import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';
import { markdownCtx } from './mdsvex.config.js';
import { generateMarkdownArtifacts } from './config/mdsvex/build/index.js';

const analyze = process.env.ANALYZE === 'true';
const isFastTest = process.env.VITEST_FAST === 'true';

const slowTestPatterns = [
  'src/routes/**/*.svelte.test.ts',
  'src/shared/ui/**/*.test.ts',
  'src/widgets/**/ui/*.test.ts',
  'src/features/background/ui/*.test.ts',
  'src/widgets/search/ui/*.test.ts',
];

export default defineConfig(({ mode }) => ({
  plugins: [
    enhancedImages(),
    tailwindcss(),
    sveltekit(),
    {
      name: 'markdown-artifacts',
      async closeBundle() {
        if (process.env.MARKDOWN_DEBUG === 'true') {
          // eslint-disable-next-line no-console
          console.log('[markdown-artifacts] Generating artifacts...');
        }
        await generateMarkdownArtifacts(markdownCtx);
      },
    },
    ...(analyze
      ? [
          visualizer({
            filename: 'target/bundle/stats.html',
            gzipSize: true,
          }),
          visualizer({
            filename: 'target/bundle/stats.json',
            gzipSize: true,
            template: 'raw-data',
          }),
        ]
      : []),
  ],

  assetsInclude: ['**/*.glsl', '**/*.wgsl'],

  build: {
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/katex')) return 'markdown-katex';
          if (id.includes('node_modules/mermaid')) return 'markdown-mermaid';
          if (id.includes('src/shared/markdown')) return 'markdown-runtime';
          if (id.includes('src/shared/lib/actions/mermaid')) return 'markdown-mermaid-runtime';
          if (id.includes('src/shared/lib/actions/codeTabs')) return 'markdown-code-tabs-runtime';
        },
      },
    },
  },

  worker: {
    format: 'es',
    plugins: () => [],
  },

  resolve: {
    conditions: mode === 'development' ? ['browser', 'development'] : ['browser'],
  },

  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'config/mdsvex/**/*.{test,spec}.js',
      'tests/markdown/**/*.{test,spec}.{js,ts}',
    ],
    exclude: isFastTest ? slowTestPatterns : [],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: process.env.CI ? ['text', 'lcov'] : ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'target/coverage',
      include: ['src/**/*.ts', 'src/**/*.svelte', 'config/mdsvex/**/*.js'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts}',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/app.html',
        'src/entities/codeTheme/codeTheme.ts',
        'src/entities/post/api.server.ts',
        'src/entities/post/post.ts',
        'src/features/engine/passes/IPass.ts',
        'src/features/engine/core/SimulationState.ts',
      ],
    },
  },
}));
