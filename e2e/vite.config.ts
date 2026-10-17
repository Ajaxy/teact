import { fileURLToPath } from 'node:url';
import { defaultClientConditions, defineConfig } from 'vite';

// Web A's test components import Teact and app modules by their relative paths in Web A. These imports resolve to
// the stand-ins in `stubs/` (tsconfig.json resolves them the same way with `rootDirs`).
const WEB_A_IMPORTS: Record<string, string> = {
  '../../lib/teact/teact': 'lib/teact/teact.ts',
  '../../lib/teact/teact-dom': 'lib/teact/teact-dom.ts',
  '../../global': 'global/index.ts',
  '../../global/types': 'global/types.ts',
  '../../api/types': 'api/types.ts',
  '../../hooks/data/useContext': 'hooks/data/useContext.ts',
  '../../hooks/schedulers/useInterval': 'hooks/schedulers/useInterval.ts',
  '../ui/Portal': 'components/ui/Portal.ts',
};

export default defineConfig(({ command, mode }) => {
  // Teact's development build on the dev server and in `--mode development` builds, as in the demo
  const isDevTeact = command === 'serve' || mode === 'development';

  return {
    base: './',
    resolve: {
      alias: Object.entries(WEB_A_IMPORTS).map(([specifier, path]) => ({
        find: new RegExp(`^${specifier.replace(/[/.]/g, '\\$&')}$`),
        replacement: fileURLToPath(new URL(`./stubs/${path}`, import.meta.url)),
      })),
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
  };
});
