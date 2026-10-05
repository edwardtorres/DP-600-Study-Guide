import { defineConfig, devices } from '@playwright/test'

/**
 * Browser flows for `npm run e2e` (kept out of `npm test` because they need a browser).
 * They run against the Vite dev server so the dev-only `?seed=` hook makes draws repeatable.
 * Set PW_CHROMIUM to a Chromium binary if Playwright's own browser isn't installed.
 */
const executablePath = process.env.PW_CHROMIUM || undefined
const port = 5179

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${port}`,
    hasTouch: true,
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, hasTouch: true } },
    { name: 'phone-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
