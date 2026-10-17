// T-heavy: updates during heavy animations
import type { ChangeEvent } from 'react';
import {
  beginHeavyAnimation, getIsHeavyAnimating, isSignal, onFullyIdle, throttleWithFullyIdle, useState,
} from '@teact/core';
import { getIsBlockingAnimating, requestAfterRender } from '@teact/core/internal';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

import { flushFrames, hasQueuedFrame, runFrame } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

const LONG_ANIMATION_MS = 60_000;

let consoleError: ReturnType<typeof vi.spyOn>;
let endAnimations: (() => void)[];

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  endAnimations = [];
});

afterEach(async () => {
  endAnimations.forEach((end) => end());
  vi.unstubAllGlobals();
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

function startAnimation(isBlocking = false) {
  const end = beginHeavyAnimation(LONG_ANIMATION_MS, isBlocking);
  endAnimations.push(end);

  return end;
}

function renderLabel() {
  let setLabel!: (value: string) => void;

  function Label() {
    const [label, setLabelState] = useState('a');
    setLabel = setLabelState;

    return <b>{label}</b>;
  }

  const container = mount(<Label />);

  return { container, setLabel: (value: string) => setLabel(value) };
}

// The browser runs `requestIdleCallback` only when it is idle, which can take longer than any fixed wait while other
// test files keep it busy. This stand-in runs the callback in the next task, so idle work is scheduled
// deterministically. It also replaces `onIdle`'s `onTickEnd` fallback in WebKit, which has no `requestIdleCallback`
function stubRequestIdleCallback() {
  vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => setTimeout(() => {
    callback({ didTimeout: false, timeRemaining: () => 50 });
  }, 0));
}

describe('Heavy animations (T-heavy)', () => {
  test('a blocking animation holds back the update pass and after-render callbacks until it ends', async () => {
    const { container, setLabel } = renderLabel();
    await flushFrames();

    const end = startAnimation(true);
    expect(getIsBlockingAnimating()).toBe(true);

    const afterRender = vi.fn();
    setLabel('b');
    requestAfterRender(afterRender);
    await flushFrames();
    expect(container.textContent).toBe('a');
    expect(afterRender).not.toHaveBeenCalled();

    end();
    expect(getIsBlockingAnimating()).toBe(false);
    await flushFrames();
    expect(container.textContent).toBe('b');
    expect(afterRender).toHaveBeenCalledTimes(1);
  });

  test('a non-blocking animation does not hold back component updates', async () => {
    const { container, setLabel } = renderLabel();
    startAnimation();

    setLabel('b');
    await flushFrames();
    expect(getIsHeavyAnimating()).toBe(true);
    expect(getIsBlockingAnimating()).toBe(false);
    expect(container.textContent).toBe('b');
  });

  test('a controlled input is reconciled only after the animation ends', async () => {
    function Input() {
      const [value] = useState('fixed');
      return <input value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => e.currentTarget.value} />;
    }

    const input = mount(<Input />).querySelector('input')!;
    const end = startAnimation();

    input.value = 'fixedX';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await flushFrames();
    expect(input.value).toBe('fixedX');

    end();
    await flushFrames();
    expect(input.value).toBe('fixed');
  });

  test('`getIsHeavyAnimating` is a signal that stays on until the last animation ends', () => {
    const changes: boolean[] = [];
    const unsubscribe = getIsHeavyAnimating.subscribe(() => changes.push(getIsHeavyAnimating()));

    expect(isSignal(getIsHeavyAnimating)).toBe(true);
    const endFirst = startAnimation();
    const endSecond = startAnimation(true);
    endFirst();
    endFirst();
    expect(getIsHeavyAnimating()).toBe(true);
    endSecond();
    unsubscribe();

    expect(changes).toEqual([true, false]);
  });

  test('an animation ends by itself after its duration', async () => {
    beginHeavyAnimation(20);
    expect(getIsHeavyAnimating()).toBe(true);

    await vi.waitFor(() => {
      expect(getIsHeavyAnimating()).toBe(false);
    });
  });

  test('`onFullyIdle` and `throttleWithFullyIdle` wait for the animation to end', async () => {
    stubRequestIdleCallback();
    const end = startAnimation();
    const idleCallback = vi.fn();
    const throttled = vi.fn();
    const throttledWithIdle = throttleWithFullyIdle(throttled);

    onFullyIdle(idleCallback);
    throttledWithIdle(1);
    throttledWithIdle(2);
    // While the animation runs, the callbacks are retried every frame, so frames never stop being scheduled
    for (let i = 0; i < 5; i++) {
      await vi.waitFor(() => {
        expect(hasQueuedFrame()).toBe(true);
      });
      expect(await runFrame()).toBe(true);
    }
    expect(idleCallback).not.toHaveBeenCalled();
    expect(throttled).not.toHaveBeenCalled();

    end();
    await vi.waitFor(async () => {
      await flushFrames();
      expect(idleCallback).toHaveBeenCalledTimes(1);
      expect(throttled.mock.calls).toEqual([[2]]);
    });
  });
});
