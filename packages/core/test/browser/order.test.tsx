// T-order and T-stale: effect order and frame consistency of the update pass
import { type TeactNode, useEffect, useLayoutEffect, useState } from '@teact/core';
import TeactDOM from '@teact/core/dom';
import { afterEach, describe, expect, test } from 'vitest';

import { flushFrames, runFrame } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

afterEach(unmountAll);

function createLog() {
  const entries: string[] = [];

  return {
    push: (entry: string) => entries.push(entry),
    take: () => entries.splice(0),
  };
}

describe('Effect order (T-order)', () => {
  test('mount and update run child effects first, later siblings first; unmount runs the parent first', async () => {
    const log = createLog();
    let setTick!: (tick: number) => void;

    function useLoggedEffects(name: string, tick: number) {
      useEffect(() => {
        log.push(`eff:${name}`);
        return () => log.push(`cln:${name}`);
      }, [name, tick]);

      useLayoutEffect(() => {
        log.push(`lay:${name}`);
        return () => log.push(`lcln:${name}`);
      }, [name, tick]);
    }

    function Child({ name, tick }: { name: string; tick: number }) {
      useLoggedEffects(name, tick);
      return <span>{name}</span>;
    }

    function Parent() {
      const [tick, setTickState] = useState(0);
      setTick = setTickState;
      useLoggedEffects('P', tick);

      return (
        <div>
          <Child name="A" tick={tick} />
          <Child name="B" tick={tick} />
        </div>
      );
    }

    const container = mount(<Parent />);
    // Layout effects run synchronously inside `render()`, passive ones in the next frame
    expect(log.take()).toEqual(['lay:B', 'lay:A', 'lay:P']);
    await flushFrames();
    expect(log.take()).toEqual(['eff:B', 'eff:A', 'eff:P']);

    setTick(1);
    await flushFrames();
    expect(log.take()).toEqual([
      'lcln:B', 'lcln:A', 'lcln:P',
      'lay:B', 'lay:A', 'lay:P',
      'cln:B', 'cln:A', 'cln:P',
      'eff:B', 'eff:A', 'eff:P',
    ]);

    TeactDOM.render(undefined, container);
    // Unmount runs every cleanup synchronously, in hook order within each component
    expect(log.take()).toEqual(['cln:P', 'lcln:P', 'cln:A', 'lcln:A', 'cln:B', 'lcln:B']);
    await flushFrames();
    expect(log.take()).toEqual([]);
  });

  test('effects are ordered by component mount order (descending), not by tree depth', async () => {
    const log = createLog();

    function Node({ name, children }: { name: string; children?: TeactNode }) {
      useLayoutEffect(() => {
        log.push(`lay:${name}`);
        return () => log.push(`lcln:${name}`);
      }, [name]);
      useEffect(() => {
        log.push(`eff:${name}`);
      }, [name]);

      return <div>{children}</div>;
    }

    // Mount order (ids): P, A, A1, B
    const container = mount(
      <Node name="P">
        <Node name="A">
          <Node name="A1" />
        </Node>
        <Node name="B" />
      </Node>,
    );
    expect(log.take()).toEqual(['lay:B', 'lay:A1', 'lay:A', 'lay:P']);
    await flushFrames();
    expect(log.take()).toEqual(['eff:B', 'eff:A1', 'eff:A', 'eff:P']);

    TeactDOM.render(undefined, container);
    expect(log.take()).toEqual(['lcln:P', 'lcln:A', 'lcln:A1', 'lcln:B']);
  });

  test('effects of one component run in declaration order, cleanups before effects', async () => {
    const log = createLog();
    let setTick!: (tick: number) => void;

    function Component() {
      const [tick, setTickState] = useState(0);
      setTick = setTickState;

      useEffect(() => {
        log.push(`eff1:${tick}`);
        return () => log.push(`cln1:${tick}`);
      }, [tick]);
      useEffect(() => {
        log.push(`eff2:${tick}`);
        return () => log.push(`cln2:${tick}`);
      }, [tick]);
      useEffect(() => {
        log.push('once');
      }, []);

      return <div>{tick}</div>;
    }

    mount(<Component />);
    await flushFrames();
    expect(log.take()).toEqual(['eff1:0', 'eff2:0', 'once']);

    setTick(1);
    await flushFrames();
    expect(log.take()).toEqual(['cln1:0', 'cln2:0', 'eff1:1', 'eff2:1']);
  });

  test('an update runs layout effects in the frame of the DOM update and passive effects in the next one', async () => {
    const log = createLog();
    let setValue!: (value: string) => void;

    function Component() {
      const [value, setValueState] = useState('a');
      setValue = setValueState;

      useLayoutEffect(() => {
        log.push(`layout:${document.getElementById('value')!.textContent}`);
      }, [value]);
      useEffect(() => {
        log.push(`passive:${value}`);
      }, [value]);

      return <div id="value">{value}</div>;
    }

    mount(<Component />);
    await flushFrames();
    log.take();

    setValue('b');
    expect(await runFrame()).toBe(true);
    expect(log.take()).toEqual(['layout:b']);
    expect(await runFrame()).toBe(true);
    expect(log.take()).toEqual(['passive:b']);
    await flushFrames();
    expect(log.take()).toEqual([]);
  });
});

describe('Frame consistency (T-stale)', () => {
  test('a child re-rendered by its parent applies its own queued state in the same frame', async () => {
    let setChildCount!: (count: number) => void;
    let setGo!: (go: boolean) => void;
    let childRenders = 0;

    function Child({ p }: { p: number }) {
      const [count, setCount] = useState(0);
      setChildCount = setCount;
      childRenders++;

      return <i>{`${p}/${count}`}</i>;
    }

    function Parent() {
      const [p, setP] = useState(1);
      const [go, setGoState] = useState(false);
      setGo = setGoState;

      useLayoutEffect(() => {
        if (go) setP(2);
      }, [go]);
      useEffect(() => {
        if (go) setChildCount(1);
      }, [go]);

      return <div><Child p={p} /></div>;
    }

    const container = mount(<Parent />);
    await flushFrames();
    childRenders = 0;

    const frames = [container.textContent];
    setGo(true);
    while (await runFrame()) {
      frames.push(container.textContent);
    }

    // No frame shows the new prop with the old state (`2/0`)
    expect(frames.filter((text, i) => i === 0 || text !== frames[i - 1])).toEqual(['1/0', '2/1']);
    expect(childRenders).toBe(3);
  });

  test('state set several times before a frame renders once with the last value', async () => {
    let setValue!: (update: (current: number) => number) => void;
    let renders = 0;

    function Counter() {
      const [value, setValueState] = useState(0);
      setValue = setValueState;
      renders++;

      return <b>{value}</b>;
    }

    const container = mount(<Counter />);
    renders = 0;

    setValue((current) => current + 1);
    setValue((current) => current + 1);
    setValue((current) => current + 1);
    expect(container.textContent).toBe('0');

    await flushFrames();
    expect(container.textContent).toBe('3');
    expect(renders).toBe(1);
  });
});
