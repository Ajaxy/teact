// T-signals: signals used by components (the signal API itself is covered by test/unit/signals.test.ts)
import {
  createContext, createSignal, type Signal, type TeactNode, useContextSignal, useEffect, useSignal, useState,
} from '@teact/core';
import TeactDOM from '@teact/core/dom';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

describe('Signals in components (T-signals)', () => {
  test('a signal dependency re-runs an effect without a render and is released on unmount', async () => {
    const [getSignalCount, setCount] = createSignal(0);
    const runs: number[] = [];
    const cleanups: number[] = [];
    let renders = 0;

    function Consumer({ getCount }: { getCount: Signal<number> }) {
      renders++;

      useEffect(() => {
        const count = getCount();
        runs.push(count);
        return () => cleanups.push(count);
      }, [getCount]);

      return <div />;
    }

    const container = mount(<Consumer getCount={getSignalCount} />);
    await flushFrames();
    expect(runs).toEqual([0]);

    setCount(1);
    setCount(2);
    await flushFrames();
    expect(runs).toEqual([0, 2]);
    expect(cleanups).toEqual([0]);
    expect(renders).toBe(1);

    TeactDOM.render(undefined, container);
    expect(cleanups).toEqual([0, 2]);

    setCount(3);
    await flushFrames();
    expect(runs).toEqual([0, 2]);
    expect(cleanups).toEqual([0, 2]);
  });

  test('`useSignal` keeps the same signal across renders', async () => {
    const signals: unknown[] = [];
    let setTick!: (tick: number) => void;

    function Component() {
      const [tick, setTickState] = useState(0);
      setTick = setTickState;
      const [getValue, setValue] = useSignal('initial');
      signals.push(getValue, setValue);

      return <div>{`${getValue()} ${tick}`}</div>;
    }

    const container = mount(<Component />);
    setTick(1);
    await flushFrames();

    expect(signals).toHaveLength(4);
    expect(signals[2]).toBe(signals[0]);
    expect(signals[3]).toBe(signals[1]);
    expect(container.textContent).toBe('initial 1');
  });

  test('context values are passed down as signals', async () => {
    const Context = createContext('default');
    const values: string[] = [];
    let setValue!: (value: string) => void;

    function Consumer({ name }: { name: string }) {
      const getValue = useContextSignal(Context);

      useEffect(() => {
        values.push(`${name}:${getValue()}`);
      }, [getValue, name]);

      return <i />;
    }

    function Provider({ children }: { children?: TeactNode }) {
      const [value, setValueState] = useState('first');
      setValue = setValueState;

      return <Context.Provider value={value}>{children}</Context.Provider>;
    }

    mount(
      <div>
        <Provider>
          <Consumer name="inside" />
        </Provider>
        <Consumer name="outside" />
      </div>,
    );
    await flushFrames();
    expect(values.sort()).toEqual(['inside:first', 'outside:default']);

    values.splice(0);
    setValue('second');
    await flushFrames();
    expect(values).toEqual(['inside:second']);
  });
});
