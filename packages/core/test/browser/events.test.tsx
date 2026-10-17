// Event delegation: which handlers Teact attaches to the element itself, and the events that do not bubble but are
// delegated to `document` anyway (H32)
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

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

// Counts the calls of each named handler
function createCalls() {
  const calls: Record<string, number> = {};
  const handler = (name: string) => () => {
    calls[name] = (calls[name] ?? 0) + 1;
  };

  return { calls, handler };
}

// Resolves when `element` receives the next `type` event, as a listener of its own (not through Teact)
function nextEvent(element: Element, type: string) {
  return new Promise<void>((resolve) => {
    element.addEventListener(type, () => resolve(), { once: true });
  });
}

// A non-bubbling event, as the browser dispatches it (`new Event()` defaults to `bubbles: false`)
function dispatch(element: Element, type: string) {
  element.dispatchEvent(new Event(type));
}

describe('Event delegation', () => {
  test('handlers of `scroll`, `mouseenter`, `mouseleave`, `load` and `error`, and on `<video>`, are called', () => {
    const { calls, handler } = createCalls();
    const container = mount(
      <div>
        <div
          className="box"
          onScroll={handler('scroll')}
          onMouseEnter={handler('mouseenter')}
          onMouseLeave={handler('mouseleave')}
        />
        <img alt="" onLoad={handler('load')} onError={handler('error')} />
        <video onPlay={handler('videoPlay')} />
      </div>,
    );
    const box = container.querySelector('.box')!;
    const img = container.querySelector('img')!;

    dispatch(box, 'scroll');
    dispatch(box, 'mouseenter');
    dispatch(box, 'mouseleave');
    dispatch(img, 'load');
    dispatch(img, 'error');
    dispatch(container.querySelector('video')!, 'play');

    expect(calls).toEqual({
      scroll: 1, mouseenter: 1, mouseleave: 1, load: 1, error: 1, videoPlay: 1,
    });
  });

  test('handlers of other events that do not bubble are currently never called', async () => {
    const { calls, handler } = createCalls();
    const container = mount(
      <div>
        <div
          className="box"
          onPointerEnter={handler('pointerenter')}
          onPointerLeave={handler('pointerleave')}
          onScrollEnd={handler('scrollend')}
          onBeforeToggle={handler('beforetoggle')}
        />
        <details onToggle={handler('toggle')}>
          <summary>Summary</summary>
          Content
        </details>
        <dialog onClose={handler('close')} onCancel={handler('cancel')} />
        <form><input required onInvalid={handler('invalid')} /></form>
        <audio onPlay={handler('audioPlay')} onEnded={handler('audioEnded')} />
      </div>,
    );
    const box = container.querySelector('.box')!;
    const details = container.querySelector('details')!;
    const dialog = container.querySelector('dialog')!;
    const input = container.querySelector('input')!;
    const audio = container.querySelector('audio')!;

    // KNOWN ISSUE H32 (pinned in B4; fix in 0.2, see KNOWN-ISSUES.md): only the five events of the test above are
    // attached to the element; every other event that does not bubble is delegated to `document`, which it never
    // reaches. Expected: each handler is called once, like the listeners that check that the events were fired
    const fired: string[] = [];
    const record = (element: Element, type: string) => {
      element.addEventListener(type, () => fired.push(type));
    };
    ['pointerenter', 'pointerleave', 'scrollend', 'beforetoggle'].forEach((type) => record(box, type));
    record(dialog, 'cancel');
    record(input, 'invalid');
    record(audio, 'play');
    record(audio, 'ended');

    // Fired by the browser
    const toggled = nextEvent(details, 'toggle');
    details.open = true;
    await toggled;

    const closed = nextEvent(dialog, 'close');
    dialog.showModal();
    dialog.close();
    await closed;

    expect(input.checkValidity()).toBe(false);

    // Dispatched like the browser does
    ['pointerenter', 'pointerleave', 'scrollend', 'beforetoggle'].forEach((type) => dispatch(box, type));
    dispatch(dialog, 'cancel');
    dispatch(audio, 'play');
    dispatch(audio, 'ended');

    expect(fired).toEqual([
      'invalid', 'pointerenter', 'pointerleave', 'scrollend', 'beforetoggle', 'cancel', 'play', 'ended',
    ]);
    expect(calls).toEqual({});
  });
});
