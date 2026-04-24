import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';

type BrowserKey = 'chrome' | 'firefox';
type DeviceClass = 'desktop' | 'mobile';

type TargetDescriptor = {
  key: string;
  browser: BrowserKey;
  deviceClass: DeviceClass;
};

const mobileViewport = (({ viewport, deviceScaleFactor, hasTouch }) => ({
  viewport,
  deviceScaleFactor,
  hasTouch,
}))(devices['Pixel 7']);

function createDeviceUse(browser: BrowserKey, deviceClass: DeviceClass) {
  if (browser === 'chrome' && deviceClass === 'desktop') {
    return { ...devices['Desktop Chrome'] };
  }

  if (browser === 'chrome' && deviceClass === 'mobile') {
    return { ...devices['Pixel 7'] };
  }

  if (browser === 'firefox' && deviceClass === 'desktop') {
    return { ...devices['Desktop Firefox'] };
  }

  return {
    ...devices['Desktop Firefox'],
    ...mobileViewport,
  };
}

function createLandingFirstProjects(targets: TargetDescriptor[]) {
  const projects: Project[] = [];

  for (const target of targets) {
    const landingName = `landing-${target.key}`;

    projects.push({
      name: landingName,
      testMatch: 'homepage.spec.ts',
      use: createDeviceUse(target.browser, target.deviceClass),
    });

    projects.push({
      name: target.key,
      dependencies: [landingName],
      testMatch: /\.spec\.ts$/,
      testIgnore: 'homepage.spec.ts',
      use: createDeviceUse(target.browser, target.deviceClass),
    });
  }

  return projects;
}

type FactoryOptions = {
  testDir?: string;
  baseURL: string;
  outputDir: string;
  reportDir: string;
  webServer?: NonNullable<PlaywrightTestConfig['webServer']>;
  retries?: number;
  targets: TargetDescriptor[];
};

export function createPlaywrightConfig(options: FactoryOptions) {
  return defineConfig({
    testDir: options.testDir ?? './tests/playwright',
    outputDir: options.outputDir,
    timeout: 120_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: options.retries ?? 0,
    workers: 1,
    reporter: [['html', { outputFolder: options.reportDir }]],
    use: {
      baseURL: options.baseURL,
      trace: 'on-first-retry',
    },
    projects: createLandingFirstProjects(options.targets),
    webServer: options.webServer,
  });
}
