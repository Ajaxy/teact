// @vitest-environment jsdom
// T-devtools on the built package: the installers add their tools in the development build only, and the returned
// function removes them; in the production build they do nothing
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';

import { ENTRIES } from './package';

type DevToolsInstaller = () => () => void;

const TEACTN_WINDOW_FUNCTIONS = ['getGlobal', 'setGlobal', 'getActions'];

function entryFile(specifier: string, build: 'dist' | 'dist/dev') {
  return ENTRIES.find((entry) => entry.specifier === specifier)!.files[build];
}

async function loadInstallers(build: 'dist' | 'dist/dev') {
  const [core, teactn] = await Promise.all([
    import(/* @vite-ignore */ entryFile('@teact/core', build)),
    import(/* @vite-ignore */ entryFile('@teact/core/teactn', build)),
  ]) as [{ installTeactDevTools: DevToolsInstaller }, { installTeactNDevTools: DevToolsInstaller }];

  return [core.installTeactDevTools, teactn.installTeactNDevTools];
}

function doubleClick() {
  document.body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dist (production)', () => {
  test('the installers add nothing, and their removers do nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const addEventListener = vi.spyOn(window.EventTarget.prototype, 'addEventListener');
    const windowNames = new Set(Object.getOwnPropertyNames(window));

    const uninstallers = (await loadInstallers('dist')).map((install) => install());
    doubleClick();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(Object.getOwnPropertyNames(window).filter((name) => !windowNames.has(name))).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
    uninstallers.forEach((uninstall) => {
      expect(uninstall).toBeTypeOf('function');
      uninstall();
    });
  });
});

describe('dist/dev (development)', () => {
  test('the installers add the double-click dumps and TeactN\'s window functions, and remove them again', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [installTeactDevTools, installTeactNDevTools] = await loadInstallers('dist/dev');

    doubleClick();
    expect(warn).not.toHaveBeenCalled();

    const uninstallers = [installTeactDevTools(), installTeactNDevTools()];
    doubleClick();

    expect(warn.mock.calls.map(([label]) => label)).toEqual([
      'COMPONENTS', 'MEMOS', 'DELEGATED EVENTS STATS', 'GLOBAL CONTAINERS',
    ]);
    expect(TEACTN_WINDOW_FUNCTIONS.filter((name) => typeof (window as any)[name] === 'function'))
      .toEqual(TEACTN_WINDOW_FUNCTIONS);

    uninstallers.forEach((uninstall) => uninstall());
    warn.mockClear();
    doubleClick();

    expect(warn).not.toHaveBeenCalled();
    expect(TEACTN_WINDOW_FUNCTIONS.filter((name) => name in window)).toEqual([]);
  });
});
