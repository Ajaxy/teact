// stricterdom basics (the detectors in real browsers are covered by test/browser/strict.test.tsx)
import {
  disableStrict,
  enableStrict,
  forceMeasure,
  forceMutation,
  getPhase,
  setHandler,
  setPhase,
  suppressStrict,
} from '@teact/core/fasterdom';
import {
  afterEach, beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';

let onError: Mock<(error: Error) => void>;
let element: HTMLDivElement;

beforeEach(() => {
  onError = vi.fn();
  setHandler(onError);
  element = document.createElement('div');
  document.body.appendChild(element);
});

afterEach(() => {
  disableStrict();
  setHandler();
  setPhase('measure');
  element.remove();
});

function reports() {
  return onError.mock.calls.map(([error]) => error.message);
}

// Mutation observer callbacks run as microtasks
function flushMicrotasks() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('stricterdom', () => {
  test('the phase starts as `measure` and is set with `setPhase`', () => {
    expect(getPhase()).toBe('measure');
    setPhase('mutate');
    expect(getPhase()).toBe('mutate');
  });

  test('`forceMeasure` runs only in the mutate phase and switches to `measure` for its callback', () => {
    expect(() => forceMeasure(() => undefined)).toThrow('The current phase is \'measure\'');

    setPhase('mutate');
    expect(forceMeasure(() => getPhase())).toBe('measure');
    expect(getPhase()).toBe('mutate');
  });

  test('`forceMutation` runs only in the measure phase, unless any phase is allowed', () => {
    expect(forceMutation(() => 'result', element)).toBe('result');

    setPhase('mutate');
    expect(() => forceMutation(() => undefined, element)).toThrow('The current phase is \'mutate\'');
    expect(forceMutation(() => 'any phase', [element], true)).toBe('any phase');
  });

  test('without strict mode, nothing is reported', async () => {
    setPhase('mutate');
    void element.offsetHeight;
    setPhase('measure');
    element.setAttribute('title', 'changed');
    await flushMicrotasks();

    expect(reports()).toEqual([]);
  });

  test('strict mode reports measurements while mutating and mutations while measuring', async () => {
    enableStrict();
    enableStrict();

    setPhase('mutate');
    void element.offsetHeight;
    element.getBoundingClientRect();
    setPhase('measure');
    element.setAttribute('title', 'changed');
    await flushMicrotasks();

    // A forced node is allowed for the rest of the observer batch, and `data-*` attributes are never reported
    forceMutation(() => element.setAttribute('lang', 'en'), element);
    element.setAttribute('title', 'changed again');
    element.setAttribute('data-state', 'ignored');
    await flushMicrotasks();

    expect(reports()).toEqual([
      'Unexpected measurement detected: `offsetHeight`',
      'Unexpected measurement detected: `getBoundingClientRect`',
      'Unexpected mutation detected: `title`',
    ]);
  });

  test('`suppressStrict` runs its callback without strict mode and turns it back on, even after a throw', () => {
    expect(suppressStrict(() => 'without strict mode')).toBe('without strict mode');

    enableStrict();
    setPhase('mutate');
    expect(() => suppressStrict(() => {
      void element.offsetHeight;
      throw new Error('Callback error');
    })).toThrow('Callback error');
    expect(reports()).toEqual([]);

    void element.offsetHeight;
    expect(reports()).toEqual(['Unexpected measurement detected: `offsetHeight`']);
  });
});
