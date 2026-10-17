// T-move: keyed reorders in a `teactFastList` container, with `Element.prototype.moveBefore` where the browser has it.
// move-fallback.test.tsx runs the same reorder without it.
import { useState } from '@teact/core';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

const HAS_MOVE_BEFORE = 'moveBefore' in Element.prototype;

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
  vi.restoreAllMocks();
});

let setOrder!: (order: string[]) => void;

function List() {
  const [order, setOrderState] = useState(['a', 'b', 'c']);
  setOrder = setOrderState;

  return (
    <ul teactFastList>
      {order.map((key) => (
        <li key={key} data-key={key}>
          <input data-key={key} />
          {key === 'c' && <iframe data-key={key} />}
        </li>
      ))}
    </ul>
  );
}

function getItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll('li'));
}

describe('Keyed moves (T-move)', () => {
  test('a reorder keeps the order and the identity of the moved nodes', async () => {
    const container = mount(<List />);
    const [a, b, c] = getItems(container);

    setOrder(['c', 'a', 'b']);
    await flushFrames();
    expect(getItems(container)).toEqual([c, a, b]);

    setOrder(['b', 'c', 'a']);
    await flushFrames();
    expect(getItems(container)).toEqual([b, c, a]);
  });

  test.runIf(HAS_MOVE_BEFORE)('`moveBefore` keeps the focus and does not reload iframes in moved nodes', async () => {
    const moveBefore = vi.spyOn(Element.prototype as Element & { moveBefore: (...args: any[]) => any }, 'moveBefore');
    const container = mount(<List />);
    const [a, b, c] = getItems(container);
    const input = c.querySelector('input')!;
    const iframe = c.querySelector('iframe')!;

    input.focus();
    input.value = 'typed';
    (iframe.contentWindow as Window & { marker?: number }).marker = 1;
    expect(document.activeElement).toBe(input);

    setOrder(['c', 'a', 'b']);
    await flushFrames();

    expect(getItems(container)).toEqual([c, a, b]);
    expect(moveBefore).toHaveBeenCalledWith(c, a);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('typed');
    expect((iframe.contentWindow as Window & { marker?: number }).marker).toBe(1);
  });
});
