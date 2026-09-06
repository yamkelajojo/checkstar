import { defineConfig } from '@playwright/test'
import chromiumPackage from '@sparticuz/chromium'

/**
 * Playwright config for the Checkstar E2E suite.
 *
 * The sandbox has no access to Playwright's browser CDN, so we drive the
 * @sparticuz/chromium build that ships with the repo's devDependencies
 * (the same binary the browser-lab probes use) via executablePath.
 * On a machine with normal network access you can swap to a
 * `npx playwright install chromium`-managed browser by setting
 * CHROMIUM_EXECUTABLE=playwright.
 */

const chromium = chromiumPackage.default ?? chromiumPackage
const executablePath =
  process.env.CHROMIUM_EXECUTABLE === 'playwright'
    ? undefined
    : await chromium.executablePath()

// @sparticuz/chromium extracts its Amazon-Linux system libraries (libnspr4,
// libnss3, …) next to the browser binary at /tmp/al2023. The browser is
// spawned as a child process, so exporting LD_LIBRARY_PATH here (after
// executablePath() has run the extraction) makes the suite self-contained.
import { existsSync } from 'node:fs'
const sparticuzLibs = '/tmp/al2023/lib'
if (executablePath && existsSync(sparticuzLibs)) {
  process.env.LD_LIBRARY_PATH = [sparticuzLibs, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(':')
}

// --single-process / --no-zygote are Lambda-memory optimisations; on a normal
// multi-worker machine they destabilise the browser (crashes mid-run). Strip
// them and let Chromium run its default multi-process mode.
const launchArgs = chromium.args.filter(
  (a) => a !== '--single-process' && a !== '--no-zygote'
)

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    locale: 'en-ZA',
    launchOptions: {
      executablePath,
      args: launchArgs,
    },
  },
  // One worker: the sparticuz Chromium build is only stable with a single
  // browser instance on this 2-vCPU sandbox (parallel launches stall).
  workers: 1,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
