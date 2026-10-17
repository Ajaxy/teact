// T-noside and T-devtools on the source with the dev-build flags: importing Teact changes nothing global, and the dev
// tools exist only between their installation and their removal. test/dist/ checks both built packages.
import { installTeactDevTools, memo } from '@teact/core';
import TeactDOM from '@teact/core/dom';
import {
  getUntypedActions, getUntypedGlobal, installTeactNDevTools, setUntypedGlobal, withUntypedGlobal,
} from '@teact/core/teactn';
import {
  afterEach, beforeEach, describe, expect, type MockInstance, onTestFinished, test, vi,
} from 'vitest';

let root: HTMLDivElement;
let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  vi.useFakeTimers();
  root = document.createElement('div');
  document.body.appendChild(root);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(async () => {
  TeactDOM.render(undefined, root);
  await vi.runAllTimersAsync();
  root.remove();
  warn.mockRestore();
  vi.useRealTimers();
});

function doubleClick() {
  document.body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
}

function loggedLabels() {
  return warn.mock.calls.map(([label]) => label as string);
}

describe('Importing Teact (T-noside)', () => {
  test('adds no event listeners and no window properties', async () => {
    const windowKeys = new Set(Object.getOwnPropertyNames(window));
    const addEventListener = vi.spyOn(window.EventTarget.prototype, 'addEventListener');

    vi.resetModules();
    await Promise.all([
      import('@teact/core'),
      import('@teact/core/dom'),
      import('@teact/core/teactn'),
      import('@teact/core/fasterdom'),
      import('@teact/core/internal'),
      import('@teact/core/jsx-runtime'),
      import('@teact/core/jsx-dev-runtime'),
    ]);

    expect(addEventListener).not.toHaveBeenCalled();
    expect(Object.getOwnPropertyNames(window).filter((key) => !windowKeys.has(key))).toEqual([]);
    addEventListener.mockRestore();
  });

  test('a double click logs nothing until the dev tools are installed', () => {
    doubleClick();

    expect(warn).not.toHaveBeenCalled();
    expect('getGlobal' in window).toBe(false);
  });
});

describe('installTeactDevTools (T-devtools)', () => {
  test('a double click logs component, memo and delegated event stats until the tools are removed', () => {
    function Item({ label }: { label: string }) {
      return <button type="button" onClick={noop}>{label}</button>;
    }
    const MemoItem = memo(Item);
    TeactDOM.render(
      <div>
        <MemoItem label="a" />
        <MemoItem label="b" />
      </div>, root);

    const uninstall = installTeactDevTools();
    onTestFinished(uninstall);
    doubleClick();

    expect(loggedLabels()).toEqual(['COMPONENTS', 'MEMOS', 'DELEGATED EVENTS STATS']);
    const [[, components], , [, delegationStats]] = warn.mock.calls as [string, any][];
    // Sorted by render count, so TOTAL, which counts every render, comes first
    expect(components[0]).toMatchObject({ name: 'TOTAL' });
    expect(components).toContainEqual(expect.objectContaining({ name: 'memo>Item', renders: 2 }));
    expect(components).toContainEqual(expect.objectContaining({ name: 'Item', renders: 2 }));
    expect(delegationStats).toMatchObject({ delegationElementsCount: 2 });

    uninstall();
    warn.mockClear();
    doubleClick();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('installTeactNDevTools (T-devtools)', () => {
  test('exposes the global and the actions on `window` and logs containers until removed', () => {
    const Container = withUntypedGlobal(() => ({}))(function Counter() {
      return <div />;
    });
    setUntypedGlobal({ ...getUntypedGlobal() });
    TeactDOM.render(<Container />, root);

    const uninstall = installTeactNDevTools();
    onTestFinished(uninstall);
    const windowWithTools = window as typeof window & Record<string, unknown>;

    expect(windowWithTools.getGlobal).toBe(getUntypedGlobal);
    expect(windowWithTools.setGlobal).toBe(setUntypedGlobal);
    expect(windowWithTools.getActions).toBe(getUntypedActions);

    doubleClick();
    expect(warn).toHaveBeenCalledExactlyOnceWith('GLOBAL CONTAINERS', [
      { DEBUG_componentName: 'Counter', DEBUG_updates: 0 },
    ]);

    uninstall();
    warn.mockClear();
    doubleClick();

    expect(warn).not.toHaveBeenCalled();
    expect(['getGlobal', 'setGlobal', 'getActions'].filter((key) => key in window)).toEqual([]);
  });

  test('removal keeps a window property that the app has replaced since', () => {
    const uninstall = installTeactNDevTools();
    const windowWithTools = window as typeof window & Record<string, unknown>;
    const ownGetGlobal = () => ({});
    windowWithTools.getGlobal = ownGetGlobal;

    uninstall();

    expect(windowWithTools.getGlobal).toBe(ownGetGlobal);
    expect('setGlobal' in window).toBe(false);
    delete windowWithTools.getGlobal;
  });
});

function noop() {}
