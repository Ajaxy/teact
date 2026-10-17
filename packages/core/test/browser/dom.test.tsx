// T-render, T-attr, T-remount and T-fasttype: `render()`, attributes, DOM changes made outside Teact, and fast-list
// detection
import { useState } from '@teact/core';
import TeactDOM, {
  addExtraClass, removeExtraClass, render, setExtraStyles, toggleExtraClass,
} from '@teact/core/dom';
import {
  afterEach, beforeEach, describe, expect, expectTypeOf, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { createContainer, mount, unmountAll } from '../utils/mount';

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

describe('render() (T-render)', () => {
  test('returns `undefined` when mounting, updating and unmounting', () => {
    const container = createContainer();

    expect(render(<div>1</div>, container)).toBeUndefined();
    expect(render(<div>2</div>, container)).toBeUndefined();
    expect(container.textContent).toBe('2');
    expect(render(undefined, container)).toBeUndefined();
    expect(container.textContent).toBe('');
  });

  test('is declared to return `undefined`, so a component can return its result', () => {
    expectTypeOf(render).returns.toEqualTypeOf<undefined>();
    expect(TeactDOM.render).toBe(render);
  });
});

describe('Attributes (T-attr)', () => {
  test('`autoFocus` and `srcDoc` are mapped to the `autofocus` and `srcdoc` properties', () => {
    const container = mount(
      <div>
        <input autoFocus />
        <iframe srcDoc="<p>content</p>" />
      </div>,
    );
    const input = container.querySelector('input')!;
    const iframe = container.querySelector('iframe')!;

    expect(input.autofocus).toBe(true);
    expect(input.hasAttribute('autofocus')).toBe(true);
    expect(iframe.srcdoc).toBe('<p>content</p>');
    expect(iframe.getAttribute('srcdoc')).toBe('<p>content</p>');
  });

  test('other camel-cased props are mapped to their DOM properties', () => {
    const container = mount(
      <div>
        <input autoComplete="off" autoCapitalize="none" spellCheck={false} />
        <video autoPlay />
      </div>,
    );
    const input = container.querySelector('input')!;

    // Set as properties (WebKit on macOS has no `autocapitalize` property, so there it stays an expando)
    expect(input.autocomplete).toBe('off');
    expect((input as HTMLInputElement & { autocapitalize: string }).autocapitalize).toBe('none');
    expect(input.spellcheck).toBe(false);
    expect(container.querySelector('video')!.autoplay).toBe(true);
  });

  test('`data-*`, `aria-*`, `role`, `dir` and `form` are set as attributes; others as properties', async () => {
    let setIsOn!: (value: boolean) => void;

    function Element() {
      const [isOn, setIsOnState] = useState(true);
      setIsOn = setIsOnState;

      return (
        <div>
          <form id="form-id" />
          <div
            id="target"
            data-state={isOn ? 'on' : undefined}
            aria-label="label"
            role="button"
            dir="rtl"
            title={isOn ? 'title' : undefined}
            className={isOn ? 'on' : undefined}
            style={isOn ? 'color: red;' : undefined}
          />
          <input form="form-id" />
        </div>
      );
    }

    const container = mount(<Element />);
    const target = container.querySelector<HTMLElement>('#target')!;
    expect(Object.fromEntries(Array.from(target.attributes, ({ name, value }) => [name, value]))).toEqual({
      id: 'target',
      'data-state': 'on',
      'aria-label': 'label',
      role: 'button',
      dir: 'rtl',
      title: 'title',
      class: 'on',
      style: 'color: red;',
    });
    expect(container.querySelector('input')!.form).toBe(container.querySelector('form'));

    setIsOn(false);
    await flushFrames();
    expect(target.hasAttribute('data-state')).toBe(false);
    expect(target.hasAttribute('title')).toBe(false);
    expect(target.className).toBe('');
    expect(target.style.cssText).toBe('');
  });

  test('extra classes and styles set outside Teact survive re-renders', async () => {
    let setClassName!: (value: string) => void;

    function Element() {
      const [className, setClassNameState] = useState('a');
      setClassName = setClassNameState;

      return <div className={className} style="color: red" />;
    }

    const container = mount(<Element />);
    const div = container.querySelector('div')!;

    addExtraClass(div, 'extra');
    toggleExtraClass(div, 'toggled');
    setExtraStyles(div, { opacity: '0.5', '--custom': '1px' });

    setClassName('b');
    await flushFrames();
    expect(div.className).toBe('extra toggled b');
    expect(div.style.opacity).toBe('0.5');
    expect(div.style.getPropertyValue('--custom')).toBe('1px');
    expect(div.style.color).toBe('red');

    removeExtraClass(div, 'extra');
    toggleExtraClass(div, 'toggled');
    setClassName('c');
    await flushFrames();
    expect(div.className).toBe('c');
  });
});

describe('DOM changes made outside Teact (T-remount)', () => {
  test('unmounting a node that was already removed from the DOM does not throw', async () => {
    let setIsShown!: (value: boolean) => void;

    function Container() {
      const [isShown, setIsShownState] = useState(true);
      setIsShown = setIsShownState;

      // The last child: when hidden, it is removed rather than replaced with a placeholder
      return (
        <div>
          <b>before</b>
          {isShown && <span>removable</span>}
        </div>
      );
    }

    const container = mount(<Container />);
    container.querySelector('span')!.remove();

    setIsShown(false);
    await flushFrames();
    expect(container.innerHTML).toBe('<div><b>before</b></div>');

    setIsShown(true);
    await flushFrames();
    expect(container.innerHTML).toBe('<div><b>before</b><span>removable</span></div>');
  });
});

describe('Fast lists (T-fasttype)', () => {
  function Items({ order }: { order: string[]; teactFastList?: boolean }) {
    return order.map((key) => <li key={key}>{key}</li>);
  }

  test('`teactFastList` on a tag keeps keyed nodes when they move', async () => {
    let setOrder!: (order: string[]) => void;

    function List() {
      const [order, setOrderState] = useState(['a', 'b', 'c']);
      setOrder = setOrderState;

      return <ul teactFastList>{order.map((key) => <li key={key}>{key}</li>)}</ul>;
    }

    const container = mount(<List />);
    const [a, b, c] = Array.from(container.querySelectorAll('li'));

    setOrder(['c', 'b', 'a']);
    await flushFrames();
    expect(Array.from(container.querySelectorAll('li'))).toEqual([c, b, a]);
  });

  test('`teactFastList` on a component does not switch its children to fast-list diffing', async () => {
    let setOrder!: (order: string[]) => void;

    function List() {
      const [order, setOrderState] = useState(['a', 'b', 'c']);
      setOrder = setOrderState;

      return <ul><Items teactFastList order={order} /></ul>;
    }

    const container = mount(<List />);
    const before = Array.from(container.querySelectorAll('li'));

    setOrder(['c', 'b', 'a']);
    await flushFrames();

    // Children are diffed by index: keys that change at an index replace the node
    const after = Array.from(container.querySelectorAll('li'));
    expect(after.map((item) => item.textContent)).toEqual(['c', 'b', 'a']);
    expect(after[0]).not.toBe(before[2]);
    expect(after[2]).not.toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });
});
