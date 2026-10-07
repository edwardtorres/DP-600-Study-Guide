import { defineConfig, devices } from '@playwright/test'

/**
 * Production checks (`npm run e2e:prod`): the built app served exactly as Azure Static Web Apps
 * serves it (scripts/serve-dist.ts applies public/staticwebapp.config.json: CSP, headers, fallback).
 * Set E2E_BASE_URL to run the same specs against the live site instead (no local server).
 * These specs don't use the dev-only ?seed= / ?mock=short hooks, which production builds don't have.
 */
const executablePath = process.env.PW_CHROMIUM || undefined
const live = process.env.E2E_BASE_URL
const port = 4173

export default defineConfig({
  testDir: './e2e/prod',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  use: {
    baseURL: live ?? `http://localhost:${port}`,
    hasTouch: true,
    serviceWorkers: 'allow',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, hasTouch: true } },
    { name: 'phone-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  ...(live
    ? {}
    : {
        webServer: {
          command: `npx tsx scripts/serve-dist.ts ${port}`,
          url: `http://localhost:${port}`,
          reuseExistingServer: false,
          timeout: 30_000,
        },
      }),
})
