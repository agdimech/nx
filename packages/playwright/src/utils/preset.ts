import { workspaceRoot } from '@nx/devkit';
import { lstatSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { PlaywrightTestProject, defineConfig, devices } from '@playwright/test';

export interface NxPlaywrightOptions {
  /**
   * The directory where the e2e tests are located.
   * @default './src'
   **/
  testDir?: string;
  /**
   * Include Mobile Chome and Mobile Safari browsers in test projects
   * @default false
   **/
  includeMobileBrowsers?: boolean;

  /**
   * Include Microsoft Edge and Google Chrome browsers in test projects
   * @default false
   **/
  includeBrandedBrowsers?: boolean;
}

/**
 * nx E2E Preset for Playwright
 * @description
 * this preset contains the base configuration
 * for your e2e tests that nx recommends.
 * By default html reporter is configured
 * along with the following browsers:
 * - chromium
 * - firefox
 * - webkit
 *
 * you can easily extend this within your playwright config via spreading the preset
 * @example
 * export default defineConfig({
 *   ...nxE2EPreset(__filename, options)
 *   // add your own config here
 * })
 *
 * @param pathToConfig will be used to construct the output paths for reporters and test results
 * @param options optional confiuration options
 */
export function nxE2EPreset(
  pathToConfig: string,
  options?: NxPlaywrightOptions
) {
  const normalizedPath = lstatSync(pathToConfig).isDirectory()
    ? pathToConfig
    : dirname(pathToConfig);
  const projectPath = relative(workspaceRoot, normalizedPath);
  const offset = relative(normalizedPath, workspaceRoot);

  const testResultOuputDir = join(
    offset,
    'dist',
    '.playwright',
    projectPath,
    'test-output'
  );
  const reporterOutputDir = join(
    offset,
    'dist',
    '.playwright',
    projectPath,
    'playwright-report'
  );
  const projects: PlaywrightTestProject[] = [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ];
  if (options?.includeMobileBrowsers) {
    projects.push(
      ...[
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ]
    );
  }

  if (options?.includeBrandedBrowsers) {
    projects.push(
      ...[
        {
          name: 'Microsoft Edge',
          use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
        {
          name: 'Google Chrome',
          use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        },
      ]
    );
  }

  return defineConfig({
    testDir: options.testDir ?? './src',
    outputDir: testResultOuputDir,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
      [
        'html',
        {
          outputFolder: reporterOutputDir,
        },
      ],
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
      /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
      trace: 'on-first-retry',
    },
    projects,
  });
}
