import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);

function getVersion(packageName: string) {
  const packageJson = JSON.parse(readFileSync(require.resolve(`${packageName}/package.json`), 'utf8')) as {
    version: string;
  };

  return packageJson.version;
}

// The benchmark compares production builds. Teact's comes from the `default` export condition (no `teact-dev`), on
// the dev server too. React's and Preact's are selected by `vite build` (NODE_ENV=production), so the dev server is
// for working on the page only: measure with `npm run build` and `npm run preview`.
export default defineConfig({
  base: './',
  define: {
    __LIBRARY_VERSIONS__: JSON.stringify({
      teact: getVersion('@teact/core'),
      react: getVersion('react'),
      preact: getVersion('preact'),
    }),
  },
  build: {
    sourcemap: true,
  },
  server: {
    port: 1235,
  },
});
