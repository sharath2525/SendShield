import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 45_000, expect: { timeout: 15_000 }, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', viewport: { width: 375, height: 812 } } }],
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true, timeout: 90_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
});
