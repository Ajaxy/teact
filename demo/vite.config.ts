import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Use Teact's development build (warnings and key checks) on the dev server and in `--mode development` builds
  const isDevTeact = command === 'serve' || mode === 'development';

  return {
    base: './',
    resolve: {
      conditions: isDevTeact ? ['teact-dev', ...defaultClientConditions] : [...defaultClientConditions],
    },
    oxc: {
      jsx: {
        runtime: 'automatic',
        importSource: '@teact/core',
      },
    },
    build: {
      sourcemap: true,
    },
    server: {
      port: 1234,
    },
  };
});
