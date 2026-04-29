import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

const heavyUnitTestPatterns = [
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
    ...(mode !== 'test'
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
  },

  worker: {
    format: 'es',
    plugins: () => [],
  },

  resolve: {
    conditions: ['browser', 'development'],
  },

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: process.env.VITEST_FAST === 'true' ? heavyUnitTestPatterns : [],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: process.env.CI ? ['text', 'lcov'] : ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'target/coverage',
      include: ['src/**/*.ts', 'src/**/*.svelte'],
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
