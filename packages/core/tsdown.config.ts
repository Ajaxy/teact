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

export default defineConfig([
  // Production build (`default` condition)
  {
    ...shared,
    outDir: 'dist',
    // Declaration maps too: with `sourcemap: true`, every `.d.ts` gets a `sourceMappingURL` comment
    dts: { sourcemap: true },
    define: { __TEACT_DEV__: 'false', __TEACT_DEBUG_MORE__: 'false' },
  },
  // Development build (`teact-dev` condition): warnings, key checks and debug helpers in `dist/dev/`
  {
    ...shared,
    outDir: 'dist/dev',
    dts: false,
    define: { __TEACT_DEV__: 'true', __TEACT_DEBUG_MORE__: 'false' },
  },
]);
