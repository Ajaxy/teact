// T-svg: the SVG namespace and attribute handling
import { useRef, useState } from '@teact/core';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

const SVG_NS = 'http://www.w3.org/2000/svg';

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

function namespaces(elements: Iterable<Element>) {
  return Array.from(elements, (element) => (element.namespaceURI === SVG_NS ? 'svg' : 'html'));
}

describe('SVG (T-svg)', () => {
  test('children of a component keep the SVG namespace when its parent re-renders it', async () => {
    let setCount!: (count: number) => void;

    function Circles({ count }: { count: number }) {
      return <g>{Array.from({ length: count }, (_, i) => <circle key={i} r={i} />)}</g>;
    }

    function Chart() {
      const [count, setCountState] = useState(1);
      setCount = setCountState;

      return <svg><Circles count={count} /></svg>;
    }

    const container = mount(<Chart />);
    setCount(2);
    await flushFrames();
    setCount(3);
    await flushFrames();

    expect(namespaces(container.querySelectorAll('g, circle'))).toEqual(['svg', 'svg', 'svg', 'svg']);
  });

  test('a component inside <svg> keeps the namespace when it updates itself', async () => {
    let setIsOn!: (value: boolean) => void;

    function Shapes() {
      const [isOn, setIsOnState] = useState(false);
      setIsOn = setIsOnState;

      return (
        <>
          {isOn && <circle data-testid="circle" r="5" />}
          <rect data-testid="rect" className={isOn ? 'on' : 'off'} fill={isOn ? 'red' : 'green'} width="10" />
        </>
      );
    }

    const container = mount(<svg><Shapes /></svg>);
    const rect = container.querySelector('rect')!;
    expect(rect.getAttribute('class')).toBe('off');

    setIsOn(true);
    await flushFrames();

    const circle = container.querySelector('circle')!;
    expect(circle.namespaceURI).toBe(SVG_NS);
    expect(container.querySelector('rect')).toBe(rect);
    expect(rect.getAttribute('class')).toBe('on');
    expect(rect.getAttribute('fill')).toBe('red');
    expect(Array.from(container.querySelector('svg')!.children)).toEqual([circle, rect]);

    setIsOn(false);
    await flushFrames();
    expect(container.querySelector('circle')).toBeNull();
    expect(rect.getAttribute('class')).toBe('off');
  });

  test('children of a component and of a fragment keep the namespace when the parent component updates', async () => {
    let setIsOn!: (value: boolean) => void;

    function Child({ isOn }: { isOn: boolean }) {
      return (
        <>
          {isOn && <circle data-testid="child-circle" r="5" />}
          <rect data-testid="child-rect" fill={isOn ? 'red' : 'green'} />
        </>
      );
    }

    function Parent() {
      const [isOn, setIsOnState] = useState(false);
      setIsOn = setIsOnState;

      return (
        <svg>
          <Child isOn={isOn} />
          <>
            {isOn && <circle data-testid="fragment-circle" r="5" />}
            <rect data-testid="fragment-rect" fill={isOn ? 'red' : 'green'} />
          </>
        </svg>
      );
    }

    const container = mount(<Parent />);
    setIsOn(true);
    await flushFrames();

    const children = Array.from(container.querySelector('svg')!.children);
    expect(children.map((child) => child.getAttribute('data-testid'))).toEqual([
      'child-circle', 'child-rect', 'fragment-circle', 'fragment-rect',
    ]);
    expect(namespaces(children)).toEqual(['svg', 'svg', 'svg', 'svg']);
    expect(children.map((child) => child.getAttribute('fill') ?? 'none')).toEqual(['none', 'red', 'none', 'red']);
  });

  test('an `xmlns` prop sets the namespace of the subtree', () => {
    const container = mount(
      <div>
        <svg xmlns={SVG_NS}><circle r="1" /></svg>
        <span />
      </div>,
    );

    expect(namespaces(container.querySelectorAll('svg, circle, span'))).toEqual(['svg', 'svg', 'html']);
  });

  test('`key`, `ref`, `teactFastList` and `teactOrderKey` are not set as SVG attributes', () => {
    let ref!: { current?: SVGRectElement };

    function Shape() {
      const rectRef = useRef<SVGRectElement>();
      ref = rectRef;

      return (
        <svg {...{ teactFastList: true }}>
          <rect key="r1" ref={rectRef} teactOrderKey={1} width="5" />
        </svg>
      );
    }

    const container = mount(<Shape />);
    const rect = container.querySelector('rect')!;

    expect(Array.from(rect.attributes, ({ name, value }) => `${name}=${value}`)).toEqual(['width=5']);
    expect(container.querySelector('svg')!.getAttributeNames()).toEqual([]);
    expect(ref.current).toBe(rect);
  });

  test('SVG attributes are set with `setAttribute` and removed when the prop goes away', async () => {
    let setIsOn!: (value: boolean) => void;

    function Shape() {
      const [isOn, setIsOnState] = useState(true);
      setIsOn = setIsOnState;

      return (
        <svg viewBox="0 0 10 10">
          <circle stroke-dasharray={isOn ? '1 2' : undefined} className="shape" r="1" />
        </svg>
      );
    }

    const container = mount(<Shape />);
    const svg = container.querySelector('svg')!;
    const circle = container.querySelector('circle')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 10 10');
    expect(circle.getAttribute('stroke-dasharray')).toBe('1 2');
    expect(circle.getAttribute('class')).toBe('shape');

    setIsOn(false);
    await flushFrames();
    expect(circle.hasAttribute('stroke-dasharray')).toBe(false);
  });
});
