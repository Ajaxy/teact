// TeactN containers, global updates and actions together with rendering
import { beginHeavyAnimation, useState } from '@teact/core';
import { addCallback, removeCallback, typify } from '@teact/core/teactn';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

type GlobalState = {
  a: number;
  b: number;
  isActive?: boolean;
};

type ActionPayloads = {
  increment: { key: 'a' | 'b' };
  incrementTwice: undefined;
  incrementAsync: undefined;
};

const {
  getGlobal, setGlobal, withGlobal, addActionHandler, getActions, getPromiseActions, execAfterActions,
} = typify<GlobalState, ActionPayloads>();

addActionHandler('increment', (global, actions, { key }) => ({ ...global, [key]: global[key] + 1 }));
addActionHandler('incrementTwice', (global, actions) => {
  actions.increment({ key: 'a' });
  execAfterActions(() => log.push(`after:${getGlobal().a}`));
  actions.increment({ key: 'a' });
});
addActionHandler('incrementAsync', async (global, actions) => {
  await Promise.resolve();
  actions.increment({ key: 'b' });
});

let log: string[];
let consoleError: ReturnType<typeof vi.spyOn>;
let areErrorsExpected: boolean;

beforeEach(() => {
  log = [];
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  areErrorsExpected = false;
  setGlobal({ a: 0, b: 0 });
});

afterEach(async () => {
  await unmountAll();
  if (!areErrorsExpected) {
    expect(consoleError).not.toHaveBeenCalled();
  }
  consoleError.mockRestore();
});

function Value({ name, value }: { name: string; value: number }) {
  log.push(`render:${name}=${value}`);
  return <b>{value}</b>;
}

const A = withGlobal<{ name: string }>((global) => ({ value: global.a }))(Value);
const B = withGlobal<{ name: string }>((global) => ({ value: global.b }))(Value);

describe('TeactN containers', () => {
  test('a global update re-renders only the containers whose mapped props changed', async () => {
    const container = mount(
      <div>
        <A name="a" />
        <B name="b" />
      </div>,
    );
    expect(log.splice(0)).toEqual(['render:a=0', 'render:b=0']);

    setGlobal({ ...getGlobal(), a: 1 });
    expect(container.textContent).toBe('00');
    await flushFrames();
    expect(container.textContent).toBe('10');
    expect(log.splice(0)).toEqual(['render:a=1']);

    setGlobal({ ...getGlobal(), isActive: true });
    await flushFrames();
    expect(log).toEqual([]);
  });

  test('a container re-rendered with new own props maps them right away and renders once', async () => {
    let setOffset!: (offset: number) => void;
    const Sum = withGlobal<{ offset: number }>((global, { offset }) => ({ sum: global.a + offset }))(
      ({ sum }: { sum: number }) => {
        log.push(`render:sum=${sum}`);
        return <i>{sum}</i>;
      },
    );

    function Parent() {
      const [offset, setOffsetState] = useState(0);
      setOffset = setOffsetState;

      return <Sum offset={offset} />;
    }

    const container = mount(<Parent />);
    log.splice(0);

    // Both the global and the own props change in the same tick: the container renders once
    setGlobal({ ...getGlobal(), a: 1 });
    setOffset(10);
    await flushFrames();
    expect(container.textContent).toBe('11');
    expect(log).toEqual(['render:sum=11']);
  });

  test('global updates wait for a heavy animation to end, unless forced', async () => {
    const container = mount(<A name="a" />);
    const endAnimation = beginHeavyAnimation(60_000);

    setGlobal({ ...getGlobal(), a: 1 });
    await flushFrames();
    expect(container.textContent).toBe('0');

    setGlobal({ ...getGlobal(), a: 2 }, { forceOnHeavyAnimation: true });
    await flushFrames();
    expect(container.textContent).toBe('2');

    setGlobal({ ...getGlobal(), a: 3 });
    await flushFrames();
    expect(container.textContent).toBe('2');

    endAnimation();
    await flushFrames();
    expect(container.textContent).toBe('3');
  });

  test('actions update the global in order; `execAfterActions` runs after the queue', async () => {
    const container = mount(
      <div>
        <A name="a" />
        <B name="b" />
      </div>,
    );

    getActions().incrementTwice();
    expect(getGlobal().a).toBe(2);
    expect(log).toContain('after:2');

    await getPromiseActions().incrementAsync();
    expect(getGlobal().b).toBe(1);

    await flushFrames();
    expect(container.textContent).toBe('21');
  });

  test('callbacks receive every global update at the end of the tick', async () => {
    const callback = vi.fn();
    addCallback(callback);

    setGlobal({ ...getGlobal(), a: 1 });
    setGlobal({ ...getGlobal(), a: 2 });
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ a: 2 });

    removeCallback(callback);
    setGlobal({ ...getGlobal(), a: 3 });
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('a container is not updated while its activation function returns false', async () => {
    // Activated on mount: a container that is inactive on mount has no mapped props yet, and its first activation
    // would compare them with `undefined` and throw
    setGlobal({ ...getGlobal(), isActive: true });
    const Gated = withGlobal<{ name: string }>(
      (global) => ({ value: global.a }),
      (global) => Boolean(global.isActive),
    )(Value);

    const container = mount(<Gated name="gated" />);
    expect(container.textContent).toBe('0');

    setGlobal({ ...getGlobal(), a: 1, isActive: false });
    await flushFrames();
    expect(container.textContent).toBe('0');

    setGlobal({ ...getGlobal(), a: 2, isActive: true });
    await flushFrames();
    expect(container.textContent).toBe('2');
  });

  test('`stickToFirst` keeps a container updating only while the first value it saw stays', async () => {
    setGlobal({ ...getGlobal(), b: 1 });
    const Sticky = withGlobal<{ name: string }>(
      (global) => ({ value: global.a }),
      (global, ownProps, stickToFirst) => stickToFirst(global.b),
    )(Value);

    const container = mount(<Sticky name="sticky" />);
    setGlobal({ ...getGlobal(), a: 1 });
    await flushFrames();
    expect(container.textContent).toBe('1');

    setGlobal({ ...getGlobal(), a: 2, b: 2 });
    await flushFrames();
    expect(container.textContent).toBe('1');

    setGlobal({ ...getGlobal(), a: 3, b: 1 });
    await flushFrames();
    expect(container.textContent).toBe('3');
  });

  test('an error in a mapper is reported and currently stops the update of the containers after it', async () => {
    areErrorsExpected = true;
    let shouldThrow = false;
    const Failing = withGlobal<{ name: string }>((global) => {
      if (shouldThrow) throw new Error('Mapper error');
      return { value: global.a };
    })(Value);

    const container = mount(
      <div>
        <Failing name="failing" />
        <B name="b" />
      </div>,
    );
    shouldThrow = true;
    setGlobal({ ...getGlobal(), a: 1, b: 1 });
    await flushFrames();

    // KNOWN ISSUE K3 (pinned in B2; fix in 0.2 or later, see KNOWN-ISSUES.md): `updateContainers` returns on the
    // error, so `B` misses the update. Expected: '01'
    expect(container.textContent).toBe('00');
    expect(consoleError).toHaveBeenCalledWith(new Error('Mapper error'));
  });
});
