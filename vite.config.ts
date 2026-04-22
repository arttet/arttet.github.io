import { codecovVitePlugin } from '@codecov/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    visualizer({
      filename: 'target/bundle/stats.html',
      gzipSize: true,
    }),
    visualizer({
      filename: 'target/bundle/stats.json',
      gzipSize: true,
      template: 'raw-data',
    }),
    ...(process.env.CODECOV_TOKEN !== undefined
      ? [
          codecovVitePlugin({
            enableBundleAnalysis: true,
            bundleName: 'arttet.github.io',
            uploadToken: process.env.CODECOV_TOKEN,
            gitService: 'github',
            telemetry: false,
          }),
        ]
      : []),
  ],

  assetsInclude: ['**/*.glsl', '**/*.wgsl'],

  build: {
    chunkSizeWarningLimit: 600,
  },

  resolve: {
    conditions: ['browser', 'development'],
  },

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'target/coverage',
      include: ['src/**/*.ts', 'src/**/*.svelte'],
      exclude: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.d.ts', 'src/**/index.ts', 'src/app.html'],
    },
  },
});
