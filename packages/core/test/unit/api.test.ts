// T-api on the source: the runtime exports of each entry point, as listed in the plan (§3c).
// test/dist/api.test.ts checks the same lists, with the type exports, on both built packages.
import * as core from '@teact/core';
import * as internal from '@teact/core/internal';
import { describe, expect, test } from 'vitest';

import { RUNTIME_EXPORTS } from '../api';

describe('Entry points', () => {
  test.each(Object.keys(RUNTIME_EXPORTS))('%s exports the documented names', async (specifier) => {
    const module = await import(/* @vite-ignore */ specifier) as Record<string, unknown>;

    expect(Object.keys(module).sort()).toEqual([...RUNTIME_EXPORTS[specifier]].sort());
  });
});

describe('@teact/core', () => {
  test('the default export has what the classic JSX runtime needs, and nothing else', () => {
    expect(Object.keys(core.default).sort()).toEqual(['Fragment', 'createElement']);
    expect(core.default.createElement).toBe(core.createElement);
    expect(core.default.Fragment).toBe(core.Fragment);
  });

  test('`cloneElement` and `isElementUsed` are internal', () => {
    expect(core).not.toHaveProperty('cloneElement');
    expect(core).not.toHaveProperty('isElementUsed');
    expect(internal.cloneElement).toBeTypeOf('function');
    expect(internal.isElementUsed).toBeTypeOf('function');
  });
});
