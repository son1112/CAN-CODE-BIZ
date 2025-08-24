import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for comprehensive cross-browser testing */
  projects: [
    // Desktop Browsers - Core Testing
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

    // Desktop Browsers - Real Browser Testing
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        // Test PWA features specifically in Edge
        contextOptions: {
          serviceWorkers: 'allow',
        }
      },
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        // Test with real Chrome for OAuth and PWA features
        contextOptions: {
          serviceWorkers: 'allow',
          permissions: ['microphone', 'notifications'],
        }
      },
    },

    // Mobile - Modern Devices (High Priority)
    {
      name: 'Mobile Chrome Android',
      use: { 
        ...devices['Pixel 5'],
        // Test mobile-specific features
        contextOptions: {
          geolocation: { latitude: 37.7749, longitude: -122.4194 },
          permissions: ['geolocation', 'microphone'],
        }
      },
    },
    {
      name: 'Mobile Safari iOS',
      use: { 
        ...devices['iPhone 12'],
        // Test iOS-specific behaviors
        contextOptions: {
          permissions: ['microphone'],
        }
      },
    },

    // Mobile - Additional Coverage
    {
      name: 'Mobile Chrome Large',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari Large',
      use: { ...devices['iPhone 14 Pro Max'] },
    },
    {
      name: 'Tablet iPad',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'Tablet Android',
      use: { ...devices['Galaxy Tab S4'] },
    },

    // Legacy/Compatibility Testing (Lower Priority)
    {
      name: 'Mobile Safari Old',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Desktop Chrome Small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
})