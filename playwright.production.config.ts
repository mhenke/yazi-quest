import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

const baseURL = 'http://127.0.0.1:3200/yazi-quest/';

export default defineConfig(baseConfig, {
  testDir: './tests/production',
  use: { baseURL },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 3200 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
