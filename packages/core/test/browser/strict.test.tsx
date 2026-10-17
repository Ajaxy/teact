// T-strict: stricterdom's layout and mutation detectors in a real browser
import { useState } from '@teact/core';
import {
  disableStrict,
  enableStrict,
  forceMeasure,
  forceMutation,
  getPhase,
  requestMeasure,
  requestMutation,
  setHandler,
  suppressStrict,
} from '@teact/core/fasterdom';
import {
  afterEach, beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { createContainer, mount, unmountAll } from '../utils/mount';

let onError: Mock<(error: Error) => void>;

beforeEach(() => {
  onError = vi.fn();
  setHandler(onError);
});

afterEach(async () => {
  disableStrict();
  setHandler();
  await unmountAll();
});

function reports() {
  return onError.mock.calls.map(([error]) => error.message);
}

describe('Strict mode (T-strict)', () => {
  test('Teact mounts and updates inside the fasterdom phases without reports', async () => {
    let setValue!: (value: number) => void;

    function Counter() {
      const [value, setValueState] = useState(0);
      setValue = setValueState;

      return <div className={`value-${value}`} style={`order: ${value}`}>{value}</div>;
    }

    const container = createContainer();
    enableStrict();

    requestMutation(() => {
      mount(<Counter />, container);
    });
    await flushFrames();
    setValue(1);
    await flushFrames();
    setValue(2);
    await flushFrames();

    expect(container.innerHTML).toBe('<div class="value-2" style="order: 2;">2</div>');
    expect(reports()).toEqual([]);
  });

  test('measurements in the mutation phase and mutations outside it are reported', async () => {
    const container = createContainer();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    enableStrict();

    requestMutation(() => {
      void container.offsetHeight;
      container.getBoundingClientRect();
    });
    await flushFrames();
    container.setAttribute('title', 'changed');
    svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    await flushFrames();

    expect(reports()).toEqual([
      'Unexpected measurement detected: `offsetHeight`',
      'Unexpected measurement detected: `getBoundingClientRect`',
      'Unexpected mutation detected: `title`',
      'Unexpected mutation detected: `childList`',
    ]);
  });

  test('child list changes of HTML elements are currently not reported', async () => {
    const container = createContainer();
    enableStrict();

    // KNOWN ISSUE K2 (pinned in B2; fix in 0.2 or later, see KNOWN-ISSUES.md): the check meant for `contentEditable`
    // elements matches every HTML element, since the property is a non-empty string. Expected: a `childList` report
    container.appendChild(document.createElement('span'));
    container.firstChild!.remove();
    await flushFrames();

    expect(reports()).toEqual([]);
  });

  test('the phases run in order: measure, mutate, then measure again', async () => {
    const log: string[] = [];

    requestMutation(() => log.push(`mutation:${getPhase()}`));
    requestMeasure(() => log.push(`measure:${getPhase()}`));
    expect(getPhase()).toBe('measure');
    await flushFrames();

    expect(log).toEqual(['measure:measure', 'mutation:mutate']);
    expect(getPhase()).toBe('measure');
  });

  test('`forceMutation` and `forceMeasure` allow single operations in the other phase', async () => {
    const container = createContainer();
    enableStrict();

    forceMutation(() => container.setAttribute('title', 'forced'), container);

    let measured: number | undefined;
    let mutateError: Error | undefined;
    requestMutation(() => {
      measured = forceMeasure(() => container.offsetWidth);
      try {
        forceMutation(() => undefined, container);
      } catch (err) {
        mutateError = err as Error;
      }
      forceMutation(() => container.setAttribute('title', 'any phase'), container, true);
    });
    await flushFrames();

    expect(typeof measured).toBe('number');
    expect(mutateError?.message).toBe('The current phase is \'mutate\'');
    expect(() => forceMeasure(() => undefined)).toThrow('The current phase is \'measure\'');
    expect(container.title).toBe('any phase');
    expect(reports()).toEqual([]);
  });

  test('`suppressStrict` turns strict mode back on even when its callback throws', async () => {
    const container = createContainer();
    enableStrict();

    expect(() => suppressStrict(() => {
      container.setAttribute('title', 'suppressed');
      throw new Error('Callback error');
    })).toThrow('Callback error');
    await flushFrames();
    expect(reports()).toEqual([]);

    container.setAttribute('title', 'after');
    requestMutation(() => {
      void container.offsetHeight;
    });
    await flushFrames();
    expect(reports()).toEqual([
      'Unexpected mutation detected: `title`',
      'Unexpected measurement detected: `offsetHeight`',
    ]);
  });

  test('`<details open>`, `data-*` attributes and `[data-stricterdom-ignore]` subtrees are not reported', async () => {
    const container = createContainer();
    const details = document.createElement('details');
    const ignored = document.createElement('div');
    ignored.setAttribute('data-stricterdom-ignore', '');
    container.append(details, ignored);
    enableStrict();

    details.open = true;
    container.setAttribute('data-state', 'changed');
    ignored.appendChild(document.createElement('canvas'));
    ignored.setAttribute('title', 'changed');
    await flushFrames();

    expect(reports()).toEqual([]);
  });

  test('`disableStrict` restores the native layout getters and methods', () => {
    const nativeGetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!.get;
    const nativeFocus = HTMLElement.prototype.focus;

    enableStrict();
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!.get).not.toBe(nativeGetter);
    expect(HTMLElement.prototype.focus).not.toBe(nativeFocus);

    disableStrict();
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!.get).toBe(nativeGetter);
    expect(HTMLElement.prototype.focus).toBe(nativeFocus);
  });
});
