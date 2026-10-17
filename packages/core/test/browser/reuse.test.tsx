// T-reuse: JSX elements kept in variables and rendered more than once
import { useEffect, useState } from '@teact/core';
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

describe('JSX reuse (T-reuse)', () => {
  test('a tag element rendered twice gets two DOM nodes, which can be removed one by one', async () => {
    const span = <span>x</span>;
    const container = mount(
      <div>
        {span}
        {span}
      </div>,
    );
    const spans = Array.from(container.querySelectorAll('span'));
    expect(spans).toHaveLength(2);
    expect(spans[0]).not.toBe(spans[1]);

    mount(<div>{span}</div>, container);
    await flushFrames();
    expect(Array.from(container.querySelectorAll('span'))).toEqual([spans[0]]);

    mount(<div />, container);
    await flushFrames();
    expect(container.querySelectorAll('span')).toHaveLength(0);
    expect(container.innerHTML).toBe('<div></div>');
  });

  test('a component element rendered in several places gets independent state', async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>{count}</button>;
    }

    const counter = <Counter />;
    let setWithFirst!: (value: boolean) => void;

    function App() {
      const [withFirst, setWithFirstState] = useState(true);
      setWithFirst = setWithFirstState;

      return (
        <div>
          {withFirst && counter}
          <Counter />
          {counter}
        </div>
      );
    }

    const container = mount(<App />);
    const buttons = () => Array.from(container.querySelectorAll('button'));
    expect(buttons().map((button) => button.textContent)).toEqual(['0', '0', '0']);

    buttons()[0].click();
    await flushFrames();
    expect(buttons().map((button) => button.textContent)).toEqual(['1', '0', '0']);

    buttons()[2].click();
    buttons()[2].click();
    await flushFrames();
    expect(buttons().map((button) => button.textContent)).toEqual(['1', '0', '1']);

    setWithFirst(false);
    await flushFrames();
    expect(buttons()).toHaveLength(2);

    setWithFirst(true);
    await flushFrames();
    expect(buttons()).toHaveLength(3);
  });

  test('a component element kept in a variable is mounted again after being hidden', async () => {
    const log: string[] = [];

    function Counter() {
      const [count] = useState(() => {
        log.push('init');
        return 1;
      });
      useEffect(() => {
        log.push('effect');
        return () => log.push('cleanup');
      }, []);

      return <b>{count}</b>;
    }

    const counter = <Counter />;
    let setIsShown!: (value: boolean) => void;

    function App() {
      const [isShown, setIsShownState] = useState(true);
      setIsShown = setIsShownState;

      return <div>{isShown ? counter : undefined}</div>;
    }

    const container = mount(<App />);
    await flushFrames();
    setIsShown(false);
    await flushFrames();
    expect(container.innerHTML).toBe('<div></div>');

    setIsShown(true);
    await flushFrames();
    expect(container.innerHTML).toBe('<div><b>1</b></div>');
    expect(log).toEqual(['init', 'effect', 'cleanup', 'init', 'effect']);
  });

  test('a component element kept in a variable moves to another parent', async () => {
    function Leaf() {
      return <b>1</b>;
    }

    const leaf = <Leaf />;
    let setSide!: (side: 'left' | 'right') => void;

    function App() {
      const [side, setSideState] = useState<'left' | 'right'>('left');
      setSide = setSideState;

      return (
        <div>
          <p>{side === 'left' ? leaf : undefined}</p>
          <q>{side === 'right' ? leaf : undefined}</q>
        </div>
      );
    }

    const container = mount(<App />);
    expect(container.innerHTML).toBe('<div><p><b>1</b></p><q></q></div>');

    setSide('right');
    await flushFrames();
    expect(container.innerHTML).toBe('<div><p></p><q><b>1</b></q></div>');
  });
});
