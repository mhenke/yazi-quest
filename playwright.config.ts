import { defineConfig, devices } from '@playwright/test';

const isolatedServer = !!process.env.CI || process.env.PLAYWRIGHT_ISOLATE_SERVER === '1';
const localBaseURL = 'http://localhost:3000';

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
    ...(isolatedServer ? {} : { baseURL: localBaseURL }),
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
  webServer: isolatedServer
    ? {
        command: 'npm run dev -- --base / --host 127.0.0.1 --port 3100',
        env: { FORCE_COLOR: '0' },
        // Vite finds a free port, and Playwright passes the captured URL to its workers.
        wait: { stdout: /Local:\s+(?<PLAYWRIGHT_TEST_BASE_URL>http:\/\/127\.0\.0\.1:\d+)\// },
      }
    : {
        command: 'npm run dev -- --base / --port 3000 --strictPort',
        url: localBaseURL,
        reuseExistingServer: true,
      },
});
