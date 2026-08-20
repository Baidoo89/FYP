import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'visual-layout.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list']],
  outputDir: 'test-results/playwright-output',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
});
