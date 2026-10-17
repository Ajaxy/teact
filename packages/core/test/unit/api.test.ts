// T-api on the source: what each entry point exports
import * as core from '@teact/core';
import * as internal from '@teact/core/internal';
import { describe, expect, test } from 'vitest';

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
