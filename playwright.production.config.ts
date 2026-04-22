import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  outputDir: './target/test-results/production',
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'target/playwright-report-production' }]],
  use: {
    baseURL: 'https://arttet.github.io',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'production-chromium',
      testMatch: /\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'production-firefox',
      testMatch: /\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
