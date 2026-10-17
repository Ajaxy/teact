import { defineConfig, type UserConfig } from 'tsdown';

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
};

// Teact's additions to React's JSX types (src/jsx.d.ts) are copied to dist/ as they are. The declarations of the entries
// that apps reach for JSX reference them: the root (classic runtime) and the JSX runtimes (automatic runtime).
const JSX_TYPES_REFERENCE = '/// <reference path="./jsx.d.ts" />';
const DECLARATIONS_WITH_JSX_TYPES = new Set(['index.d.ts', 'jsx-runtime.d.ts', 'jsx-dev-runtime.d.ts']);

export default defineConfig([
  // Production build (`default` condition)
  {
    ...shared,
    outDir: 'dist',
    // Declaration maps too: with `sourcemap: true`, every `.d.ts` gets a `sourceMappingURL` comment
    dts: { sourcemap: true },
    define: { __TEACT_DEV__: 'false', __TEACT_DEBUG_MORE__: 'false' },
    banner: ({ fileName }) => ({
      dts: DECLARATIONS_WITH_JSX_TYPES.has(fileName) ? JSX_TYPES_REFERENCE : undefined,
    }),
    copy: ['src/jsx.d.ts'],
  },
  // Development build (`teact-dev` condition): warnings, key checks and debug helpers in `dist/dev/`
  {
    ...shared,
    outDir: 'dist/dev',
    dts: false,
    define: { __TEACT_DEV__: 'true', __TEACT_DEBUG_MORE__: 'false' },
  },
]);
