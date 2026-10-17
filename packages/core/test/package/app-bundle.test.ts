// The production build still contains some debug-only functions (the dev tools' dumps, `orderBy`) as dead
// code: tsdown keeps every function that the code refers to before its minifier removes what DEBUG = false makes
// unreachable. An app's production bundle must not contain them. This bundles a small app with Vite, as the apps do.
import { build, type Rolldown } from 'vite';
import { describe, expect, test } from 'vitest';

import { ENTRIES, PACKAGE_DIR } from './package';

const DEV_ONLY_STRINGS = [
  'COMPONENTS',
  'MEMOS',
  'DELEGATED EVENTS STATS',
  'GLOBAL CONTAINERS',
  // The memo logs
  ' LENGTH',
];

function entryFile(specifier: string) {
  return JSON.stringify(ENTRIES.find((entry) => entry.specifier === specifier)!.files.dist);
}

// An app with components, TeactN and the setup that the apps do (`configureTeact`, the dev tools when DEBUG is on)
const APP_SOURCE = `
import { configureTeact, createElement, installTeactDevTools, memo, useState } from ${entryFile('@teact/core')};
import { render } from ${entryFile('@teact/core/dom')};
import { installTeactNDevTools, setUntypedGlobal, withUntypedGlobal } from ${entryFile('@teact/core/teactn')};

configureTeact({ onError: (error) => console.error('[App]', error) });
if (globalThis.APP_DEBUG) {
  installTeactDevTools();
  installTeactNDevTools();
}

const Counter = memo(function Counter({ step }) {
  const [count, setCount] = useState(0);
  return createElement('button', { onClick: () => setCount(count + step) }, count);
});
const Container = withUntypedGlobal((global) => ({ step: global.step }))(Counter);

setUntypedGlobal({ step: 1 });
render(createElement(Container, {}), document.getElementById('root'));
`;

describe('An app\'s production bundle', () => {
  test('contains none of the debug-only code of dist/', async () => {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      root: PACKAGE_DIR,
      plugins: [{
        name: 'app-entry',
        resolveId: (id) => (id === 'virtual:app' ? '\0app' : undefined),
        load: (id) => (id === '\0app' ? APP_SOURCE : undefined),
      }],
      build: {
        write: false,
        minify: true,
        rolldownOptions: { input: 'virtual:app' },
      },
    }) as Rolldown.RolldownOutput;
    const code = result.output.map((chunk) => (chunk.type === 'chunk' ? chunk.code : '')).join('\n');

    expect(code).toContain('teact.signal');
    expect(DEV_ONLY_STRINGS.filter((string) => code.includes(string))).toEqual([]);
  });
});
