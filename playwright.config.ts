import { createPlaywrightConfig } from './tests/playwright/playwright.shared';

export default createPlaywrightConfig({
  baseURL: 'http://localhost:4173',
  outputDir: './target/test-results',
  reportDir: 'target/playwright-report',
  retries: process.env.CI ? 2 : 0,
  targets: [
    {
      key: 'chrome-desktop',
      browser: 'chrome',
      deviceClass: 'desktop',
    },
  ],
  webServer: {
    command: 'bun run serve:playwright',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
