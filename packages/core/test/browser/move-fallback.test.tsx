// T-move fallback: teact-dom.ts checks for `Element.prototype.moveBefore` when it is evaluated, so the method is
// removed in the first import, before Teact is loaded (the browser setup file does not import Teact).
import './utils/withoutMoveBefore';

import { useState } from '@teact/core';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

afterEach(async () => {
  await unmountAll();
  vi.restoreAllMocks();
});

describe('Keyed moves without `moveBefore` (T-move)', () => {
  test('a reorder uses `insertBefore` and keeps the order and the identity of the moved nodes', async () => {
    expect('moveBefore' in Element.prototype).toBe(false);

    let setOrder!: (order: string[]) => void;

    function List() {
      const [order, setOrderState] = useState(['a', 'b', 'c', 'd']);
      setOrder = setOrderState;

      return <ul teactFastList>{order.map((key) => <li key={key}>{key}</li>)}</ul>;
    }

    const insertBefore = vi.spyOn(Node.prototype, 'insertBefore');
    const container = mount(<List />);
    const items = () => Array.from(container.querySelectorAll('li'));
    const [a, b, c, d] = items();

    insertBefore.mockClear();
    setOrder(['d', 'a', 'b', 'c']);
    await flushFrames();
    expect(items()).toEqual([d, a, b, c]);
    expect(insertBefore).toHaveBeenCalledWith(d, a);

    setOrder(['b', 'd', 'c', 'a']);
    await flushFrames();
    expect(items()).toEqual([b, d, c, a]);
    expect(items().map((item) => item.textContent)).toEqual(['b', 'd', 'c', 'a']);
  });
});
