// Reconciliation basics: fragments, text, positions of replaced elements, refs, keys and fast lists
import {
  type ElementRef, memo, useRef, useState,
} from '@teact/core';
import TeactDOM from '@teact/core/dom';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

let consoleError: ReturnType<typeof vi.spyOn>;
let areErrorsExpected: boolean;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  areErrorsExpected = false;
});

afterEach(async () => {
  await unmountAll();
  if (!areErrorsExpected) {
    expect(consoleError).not.toHaveBeenCalled();
  }
  consoleError.mockRestore();
});

function childTexts(element: Element) {
  return Array.from(element.children, (child) => child.textContent);
}

function useToggle(initial: boolean) {
  const [value, setValue] = useState(initial);
  return [value, () => setValue((current) => !current)] as const;
}

describe('Fragments and text', () => {
  test('an emptied fragment keeps its position and its items come back before the next sibling', async () => {
    let toggle!: NoneToVoidFunction;

    function Items({ items }: { items: number[] }) {
      return <>{items.map((item) => <div>{item}</div>)}</>;
    }

    function App() {
      const [isOn, toggleState] = useToggle(true);
      toggle = toggleState;

      return (
        <section>
          <h2>first</h2>
          <Items items={isOn ? [1, 2, 3] : []} />
          <div>last</div>
        </section>
      );
    }

    const section = mount(<App />).querySelector('section')!;
    expect(childTexts(section)).toEqual(['first', '1', '2', '3', 'last']);

    toggle();
    await flushFrames();
    expect(childTexts(section)).toEqual(['first', 'last']);

    toggle();
    await flushFrames();
    expect(childTexts(section)).toEqual(['first', '1', '2', '3', 'last']);
  });

  test('a fragment inserted between siblings does not remount them', async () => {
    let toggle!: NoneToVoidFunction;

    function Child() {
      const [id] = useState(() => Math.random());
      return <p>{id}</p>;
    }

    function App() {
      const [isOn, toggleState] = useToggle(false);
      toggle = toggleState;

      return (
        <section>
          <h2>title</h2>
          {isOn ? (
            <>
              <span>fragment</span>
              <span>content</span>
            </>
          ) : undefined}
          <Child />
        </section>
      );
    }

    const section = mount(<App />).querySelector('section')!;
    const child = section.querySelector('p')!;
    const id = child.textContent;

    toggle();
    await flushFrames();
    expect(Array.from(section.children, (element) => element.tagName)).toEqual(['H2', 'SPAN', 'SPAN', 'P']);
    expect(section.querySelector('p')).toBe(child);

    toggle();
    await flushFrames();
    expect(Array.from(section.children, (element) => element.tagName)).toEqual(['H2', 'P']);
    expect(section.querySelector('p')).toBe(child);
    expect(child.textContent).toBe(id);
  });

  test('a component that renders text does not replace the text before it', async () => {
    let toggle!: NoneToVoidFunction;

    function Text() {
      return 'text component';
    }

    function App() {
      const [withFirstLine, toggleState] = useToggle(true);
      toggle = toggleState;

      return (
        <div>
          {withFirstLine && 'First line'}
          <Text />
          Last line
        </div>
      );
    }

    const div = mount(<App />).querySelector('div')!;
    expect(div.textContent).toBe('First linetext componentLast line');

    toggle();
    await flushFrames();
    expect(div.textContent).toBe('text componentLast line');

    toggle();
    await flushFrames();
    expect(div.textContent).toBe('First linetext componentLast line');
  });

  test('a single text child is rendered as the text of its parent', () => {
    const div = mount(<div>only text</div>).querySelector('div')!;

    expect(div.childNodes).toHaveLength(1);
    expect(div.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    expect(div.textContent).toBe('only text');
  });
});

describe('Replaced elements', () => {
  test('content that replaces an element of another type takes its position', async () => {
    let toggle!: NoneToVoidFunction;

    function Pair() {
      return (
        <>
          <i>x</i>
          <i>y</i>
        </>
      );
    }

    function App() {
      const [isTag, toggleState] = useToggle(true);
      toggle = toggleState;

      return (
        <div>
          <b>first</b>
          {isTag ? <span>tag</span> : <Pair />}
          <b>last</b>
        </div>
      );
    }

    const div = mount(<App />).querySelector('div')!;
    toggle();
    await flushFrames();
    expect(childTexts(div)).toEqual(['first', 'x', 'y', 'last']);

    toggle();
    await flushFrames();
    expect(childTexts(div)).toEqual(['first', 'tag', 'last']);
  });

  test('a component remounted by a key change keeps its position and gets new state', async () => {
    let changeKey!: NoneToVoidFunction;

    function Counter() {
      const [count, setCount] = useState(0);
      return <>{[<button onClick={() => setCount(count + 1)}>{count}</button>, <i>{count}</i>]}</>;
    }

    function App() {
      const [key, toggleState] = useToggle(true);
      changeKey = toggleState;

      return (
        <div>
          <b>first</b>
          <Counter key={String(key)} />
          <b>last</b>
        </div>
      );
    }

    const div = mount(<App />).querySelector('div')!;
    div.querySelector('button')!.click();
    await flushFrames();
    expect(childTexts(div)).toEqual(['first', '1', '1', 'last']);

    changeKey();
    await flushFrames();
    expect(childTexts(div)).toEqual(['first', '0', '0', 'last']);
  });

  test('a memo component does not render again with equal props', async () => {
    let setTick!: (tick: number) => void;
    let renders = 0;

    const Label = memo(({ text }: { text: string }) => {
      renders++;
      return <b>{text}</b>;
    });

    function App() {
      const [tick, setTickState] = useState(0);
      setTick = setTickState;

      return (
        <div>
          <Label text={tick < 2 ? 'same' : 'changed'} />
          {tick}
        </div>
      );
    }

    const container = mount(<App />);
    setTick(1);
    await flushFrames();
    expect(renders).toBe(1);

    setTick(2);
    await flushFrames();
    expect(renders).toBe(2);
    expect(container.textContent).toBe('changed2');
  });
});

describe('Refs', () => {
  test('object and function refs get the element and are cleared on unmount', () => {
    const objectRef: ElementRef<HTMLDivElement> = { current: undefined };
    const functionRef = vi.fn();

    const container = mount(<div ref={objectRef}><span ref={functionRef} /></div>);
    const div = container.querySelector('div')!;
    expect(objectRef.current).toBe(div);
    expect(functionRef.mock.calls).toEqual([[div.firstChild]]);

    TeactDOM.render(undefined, container);
    expect(objectRef.current).toBeUndefined();
    expect(functionRef.mock.calls).toEqual([[div.firstChild], [undefined]]);
  });

  test('a ref moves to the new element when the tag changes, and is cleared when a reused node drops it', async () => {
    let toggle!: NoneToVoidFunction;
    let refs!: { input: ElementRef<HTMLInputElement>; heading: ElementRef<HTMLHeadingElement> };

    function App() {
      const [isShown, toggleState] = useToggle(true);
      toggle = toggleState;
      const inputRef = useRef<HTMLInputElement>();
      const headingRef = useRef<HTMLHeadingElement>();
      refs = { input: inputRef, heading: headingRef };

      return (
        <div>
          {isShown ? <input ref={inputRef} /> : <input />}
          {isShown ? <h1 ref={headingRef}>Shown</h1> : <h2 ref={headingRef}>Hidden</h2>}
        </div>
      );
    }

    const container = mount(<App />);
    const input = container.querySelector('input')!;
    input.value = 'kept';
    expect(refs.input.current).toBe(input);
    expect(refs.heading.current!.tagName).toBe('H1');

    toggle();
    await flushFrames();
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('kept');
    expect(refs.input.current).toBeUndefined();
    expect(refs.heading.current).toBe(container.querySelector('h2'));

    toggle();
    await flushFrames();
    expect(refs.input.current).toBe(input);
    expect(refs.heading.current).toBe(container.querySelector('h1'));
  });

  test('`onChange` of an object ref is called when the ref changes', () => {
    const onChange = vi.fn();
    const ref: ElementRef<HTMLDivElement> & { onChange: NoneToVoidFunction } = { current: undefined, onChange };

    const container = mount(<div ref={ref} />);
    expect(onChange).toHaveBeenCalledTimes(1);
    TeactDOM.render(undefined, container);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('Keys', () => {
  test('outside fast lists, children are diffed by index and a changed key replaces the node', async () => {
    let setItems!: (items: string[]) => void;

    function List() {
      const [items, setItemsState] = useState(['a', 'b']);
      setItems = setItemsState;

      return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
    }

    const container = mount(<List />);
    const [a, b] = Array.from(container.querySelectorAll('li'));

    setItems(['a', 'c', 'b']);
    await flushFrames();
    const items = Array.from(container.querySelectorAll('li'));
    expect(items.map((item) => item.textContent)).toEqual(['a', 'c', 'b']);
    expect(items[0]).toBe(a);
    expect(items[1]).not.toBe(b);
    expect(items[2]).not.toBe(b);
  });

  test('a fast list inserts new keyed children and keeps the others, also at both ends', async () => {
    let setItems!: (items: string[]) => void;

    function List() {
      const [items, setItemsState] = useState(['b', 'c']);
      setItems = setItemsState;

      return <ul teactFastList>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
    }

    const container = mount(<List />);
    const [b, c] = Array.from(container.querySelectorAll('li'));

    setItems(['a', 'b', 'x', 'c', 'd']);
    await flushFrames();
    const items = Array.from(container.querySelectorAll('li'));
    expect(items.map((item) => item.textContent)).toEqual(['a', 'b', 'x', 'c', 'd']);
    expect(items[1]).toBe(b);
    expect(items[3]).toBe(c);

    setItems(['x', 'd']);
    await flushFrames();
    expect(Array.from(container.querySelectorAll('li'))).toEqual([items[2], items[4]]);
  });

  test('a changed `teactOrderKey` moves the existing node within a fast list', async () => {
    let setValues!: (values: Record<string, number>) => void;

    function List() {
      const [values, setValuesState] = useState<Record<string, number>>({ a: 1, b: 5, c: 10 });
      setValues = setValuesState;
      const sorted = Object.entries(values).sort(([, x], [, y]) => x - y);

      return (
        <ul teactFastList>
          {sorted.map(([key, value]) => <li key={key} teactOrderKey={value}>{`${key}:${value}`}</li>)}
        </ul>
      );
    }

    const container = mount(<List />);
    const [a, b, c] = Array.from(container.querySelectorAll('li'));

    setValues({ a: 7, b: 5, c: 10 });
    await flushFrames();
    expect(Array.from(container.querySelectorAll('li'))).toEqual([b, a, c]);
    expect(a.textContent).toBe('a:7');

    setValues({ a: 7, b: 50, c: 10 });
    await flushFrames();
    expect(Array.from(container.querySelectorAll('li'))).toEqual([a, c, b]);
  });

  test('duplicate keys in a fast list are reported in the dev build', async () => {
    let setItems!: (items: string[]) => void;

    function List() {
      const [items, setItemsState] = useState(['a', 'b']);
      setItems = setItemsState;

      return <ul teactFastList>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
    }

    areErrorsExpected = true;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Not mounted with `mount()`: the failed update leaves a virtual tree that cannot be unmounted
    const container = document.createElement('div');
    document.body.appendChild(container);
    TeactDOM.render(<List />, container);
    setItems(['a', 'a']);
    await flushFrames();

    expect(consoleWarn).toHaveBeenCalledWith('[Teact] Duplicated keys:', ['a'], expect.any(Array));
    expect(consoleError).toHaveBeenCalledWith(new Error('[Teact] Children keys are not unique'));
    consoleWarn.mockRestore();
    container.remove();
  });
});
