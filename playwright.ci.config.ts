import { createPlaywrightConfig } from './tests/playwright/playwright.shared';

const localServerURL = process.env.PLAYWRIGHT_SERVER_URL;
const localServerCommand = process.env.PLAYWRIGHT_SERVER_COMMAND;

export default createPlaywrightConfig({
  testDir: './tests/playwright',
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://arttet.github.io',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? './target/test-results/production',
  reportDir: process.env.PLAYWRIGHT_REPORT_DIR ?? 'target/playwright-report-production',
  retries: process.env.CI ? 1 : 0,
  targets: [
    {
      key: 'chrome-desktop',
      browser: 'chrome',
      deviceClass: 'desktop',
    },
    {
      key: 'chrome-mobile',
      browser: 'chrome',
      deviceClass: 'mobile',
    },
    {
      key: 'firefox-desktop',
      browser: 'firefox',
      deviceClass: 'desktop',
    },
    {
      key: 'firefox-mobile',
      browser: 'firefox',
      deviceClass: 'mobile',
    },
  ],
  webServer:
    localServerURL && localServerCommand
      ? {
          command: localServerCommand,
          url: localServerURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : undefined,
});
