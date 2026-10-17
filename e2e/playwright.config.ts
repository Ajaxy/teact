import { defineConfig, devices } from '@playwright/test';

const PORT = 4317;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const IS_CI = Boolean(process.env.CI);

// Browsers to run: `TEACT_BROWSERS=chromium,webkit` (or `all`); Chromium by default.
// Each one needs `npx playwright install <browser>`.
const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const BROWSERS = process.env.TEACT_BROWSERS === 'all'
  ? ALL_BROWSERS
  : (process.env.TEACT_BROWSERS || 'chromium').split(',') as (typeof ALL_BROWSERS)[number][];

const DEVICES = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

// The fixtures app is built twice: with Teact's development build (`/dev/`) and with the production one (`/prod/`)
const BUILDS = ['dev', 'prod'] as const;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  reporter: IS_CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'on-first-retry',
  },
  projects: BROWSERS.flatMap((browser) => BUILDS.map((build) => ({
    name: `${browser}-${build}`,
    use: {
      ...DEVICES[browser],
      baseURL: `${ORIGIN}/${build}/`,
    },
  }))),
  webServer: {
    // Builds @teact/core, then both fixture apps, and serves them
    command: [
      'npm run build --prefix ..',
      'npm run build',
      `npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    ].join(' && '),
    url: `${ORIGIN}/dev/`,
    reuseExistingServer: !IS_CI,
    timeout: 120_000,
  },
});
