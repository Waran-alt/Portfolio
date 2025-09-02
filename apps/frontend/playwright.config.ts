import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/app/svg-test',
  testMatch: '**/*.e2e.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry failed tests to handle inconsistent beforeEach hook failures */
  retries: process.env['CI'] ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : '75%',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env['NGINX_URL']
      ? `${process.env['NGINX_URL']}`
      : 'https://localhost',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',

    /* Ignore SSL certificate errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Increase timeouts for more reliable test execution */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
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

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  /* Disabled for Docker environment - assumes app is already running */
  // webServer: {
  //   command: 'yarn dev',
  //   url: process.env['NGINX_URL'] && process.env['FRONTEND_PORT'] 
  //     ? `${process.env['NGINX_URL']}:${process.env['NGINX_PORT']}`
  //     : 'https://localhost:3000',
  //   reuseExistingServer: !process.env['CI'],
  //   timeout: 60 * 1000,
  // },
});
