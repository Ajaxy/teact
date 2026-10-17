/// <reference types="node" />
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';

// Tests import the package by its public specifiers. They resolve to the source, so the suites need no build and
// see source changes (such as the mutants of `scripts/mutate-teact-dom.sh`) right away.
const ENTRIES: Record<string, string> = {
  '@teact/core': 'src/index.ts',
  '@teact/core/dom': 'src/dom.ts',
  '@teact/core/teactn': 'src/teactn.ts',
  '@teact/core/fasterdom': 'src/fasterdom.ts',
  '@teact/core/internal': 'src/internal.ts',
  '@teact/core/jsx-runtime': 'src/lib/teact/jsx-runtime.ts',
  '@teact/core/jsx-dev-runtime': 'src/lib/teact/jsx-dev-runtime.ts',
};

// Browsers for the `browser` project: `TEACT_BROWSERS=chromium,webkit` (or `all`); Chromium by default.
// Each one needs `npx playwright install <browser>`.
const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const BROWSERS = process.env.TEACT_BROWSERS === 'all'
  ? ALL_BROWSERS
  : (process.env.TEACT_BROWSERS || 'chromium').split(',') as (typeof ALL_BROWSERS)[number][];

export default defineConfig({
  resolve: {
    alias: Object.entries(ENTRIES).map(([specifier, path]) => ({
      find: new RegExp(`^${specifier.replace(/[/.]/g, '\\$&')}$`),
      replacement: fileURLToPath(new URL(path, import.meta.url)),
    })),
    // The dev build, as in apps' dev and staging builds (anything resolved through the exports map gets `dist/dev`)
    conditions: ['teact-dev', ...defaultClientConditions],
  },
  // The flags that the `teact-dev` condition selects in the built package (see tsdown.config.ts)
  define: {
    __TEACT_DEV__: 'true',
    __TEACT_DEBUG_MORE__: 'false',
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: '@teact/core',
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.{ts,tsx}'],
          setupFiles: ['test/browser/setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: BROWSERS.map((browser) => ({ browser })),
          },
        },
      },
    ],
  },
});
