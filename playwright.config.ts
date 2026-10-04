import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4382',
    headless: true,
    ...(process.env.E2E_CHROME ? { channel: 'chrome' } : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
