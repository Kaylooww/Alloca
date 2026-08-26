import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Optional escape hatch for environments that already have a Chromium build
 * on disk (CI images, sandboxes). Leave unset locally and Playwright uses the
 * browser it installed itself.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
