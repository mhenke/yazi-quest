import { defineConfig, devices } from '@playwright/test';

const isolatedServer = !!process.env.CI || process.env.PLAYWRIGHT_ISOLATE_SERVER === '1';
const port = isolatedServer ? 3100 : 3000;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  expect: {
    timeout: 2000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: '50%',
  reporter: 'html',
  use: {
    actionTimeout: 5000,
    baseURL,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --base / --port ${port} --strictPort --bypass-lock`,
    url: baseURL,
    reuseExistingServer: !isolatedServer,
  },
});
