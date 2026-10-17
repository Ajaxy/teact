import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'tsdown';

import pkg from './package.json' with { type: 'json' };

// A legal comment (`/*!`), which minifiers keep, at the top of every output file
const LICENSE_BANNER = `/*! ${pkg.name} v${pkg.version} | MIT License | (c) Alexander Zinchuk and contributors */`;

const shared: UserConfig = {
  entry: {
    index: 'src/index.ts',
    dom: 'src/dom.ts',
    teactn: 'src/teactn.ts',
    fasterdom: 'src/fasterdom.ts',
    internal: 'src/internal.ts',
    'jsx-runtime': 'src/lib/teact/jsx-runtime.ts',
    'jsx-dev-runtime': 'src/lib/teact/jsx-dev-runtime.ts',
  },
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  // Dead-code elimination only (no compression or mangling): drops the `if (DEBUG)` blocks from `dist/`
  minify: 'dce-only',
  treeshake: true,
  // `dist` is removed by the `prebuild` script; cleaning here would let the second config delete the first one's output
  clean: false,
  // `teactn.tsx` uses the automatic JSX runtime; inside the package it resolves to the source
  alias: {
    '@teact/core/jsx-runtime': './src/lib/teact/jsx-runtime.ts',
    '@teact/core/jsx-dev-runtime': './src/lib/teact/jsx-dev-runtime.ts',
  },
  banner: { js: LICENSE_BANNER },
};

// Teact's additions to React's JSX types (src/jsx.d.ts) are copied to dist/, with the license banner added. The
// declarations of the entries that apps reach for JSX reference them: the root (classic runtime) and the JSX runtimes
// (automatic runtime).
const JSX_TYPES_REFERENCE = '/// <reference path="./jsx.d.ts" />';
const DECLARATIONS_WITH_JSX_TYPES = new Set(['index.d.ts', 'jsx-runtime.d.ts', 'jsx-dev-runtime.d.ts']);

export default defineConfig([
  // Production build (`default` condition)
  {
    ...shared,
    outDir: 'dist',
    dts: false,
    define: { __TEACT_DEV__: 'false', __TEACT_DEBUG_MORE__: 'false' },
  },
  // Development build (`teact-dev` condition): warnings, key checks and debug helpers in `dist/dev/`
  {
    ...shared,
    outDir: 'dist/dev',
    dts: false,
    define: { __TEACT_DEV__: 'true', __TEACT_DEBUG_MORE__: 'false' },
  },
  // Declarations, for both builds. A pass of their own, so that they get no source maps: declaration maps would point
  // at src/, which the package does not ship. The JavaScript source maps embed their sources (`sourcesContent`).
  {
    ...shared,
    outDir: 'dist',
    sourcemap: false,
    dts: { emitDtsOnly: true },
    banner: ({ fileName }) => ({
      dts: DECLARATIONS_WITH_JSX_TYPES.has(fileName) ? `${LICENSE_BANNER}\n${JSX_TYPES_REFERENCE}` : LICENSE_BANNER,
    }),
    // Not `copy`, which cannot add the banner
    hooks: {
      'build:done': async ({ options }) => {
        const jsxTypes = await readFile(resolve(options.cwd, 'src/jsx.d.ts'), 'utf8');
        await writeFile(resolve(options.outDir, 'jsx.d.ts'), `${LICENSE_BANNER}\n${jsxTypes}`);
      },
    },
  },
]);
