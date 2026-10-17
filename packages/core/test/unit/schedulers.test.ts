// The scheduler primitives exported from `@teact/core/fasterdom`
import {
  fastRaf, onIdle, onTickEnd, throttleWith, throttleWithTickEnd,
} from '@teact/core/fasterdom';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

const FAST_RAF_FALLBACK_MS = 35;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('throttleWith', () => {
  test('calls the function once per scheduled run, with the latest arguments', () => {
    const scheduled: (() => void)[] = [];
    const scheduler = (cb: () => void) => {
      scheduled.push(cb);
    };
    const fn = vi.fn();
    const throttled = throttleWith(scheduler, fn);

    throttled(1);
    throttled(2);
    throttled(3);
    expect(scheduled).toHaveLength(1);
    expect(fn).not.toHaveBeenCalled();

    scheduled.shift()!();
    expect(fn.mock.calls).toEqual([[3]]);

    throttled(4);
    expect(scheduled).toHaveLength(1);
    scheduled.shift()!();
    expect(fn.mock.calls).toEqual([[3], [4]]);
  });
});

describe('onTickEnd', () => {
  test('runs callbacks in order at the end of the current tick', async () => {
    const log: string[] = [];
    onTickEnd(() => log.push('a'));
    onTickEnd(() => log.push('b'));
    log.push('sync');

    await Promise.resolve();
    expect(log).toEqual(['sync', 'a', 'b']);
  });

  test('a callback scheduled while the batch runs goes to the next batch', async () => {
    const log: string[] = [];
    onTickEnd(() => {
      log.push('first');
      onTickEnd(() => log.push('nested'));
    });
    onTickEnd(() => log.push('second'));

    await Promise.resolve();
    expect(log).toEqual(['first', 'second']);
    await Promise.resolve();
    expect(log).toEqual(['first', 'second', 'nested']);
  });

  test('`throttleWithTickEnd` runs once per tick with the latest arguments', async () => {
    const fn = vi.fn();
    const throttled = throttleWithTickEnd(fn);

    throttled('a');
    throttled('b');
    await Promise.resolve();
    throttled('c');
    await Promise.resolve();

    expect(fn.mock.calls).toEqual([['b'], ['c']]);
  });
});

describe('fastRaf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('runs the callbacks scheduled before a frame together, in order', () => {
    const log: string[] = [];
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame');
    fastRaf(() => log.push('a'));
    fastRaf(() => log.push('b'));

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(log).toEqual([]);
    vi.advanceTimersToNextFrame();
    expect(log).toEqual(['a', 'b']);
  });

  test('a callback scheduled while the batch runs goes to the next frame', () => {
    const log: string[] = [];
    fastRaf(() => {
      log.push('first');
      fastRaf(() => log.push('nested'));
    });

    vi.advanceTimersToNextFrame();
    expect(log).toEqual(['first']);
    vi.advanceTimersToNextFrame();
    expect(log).toEqual(['first', 'nested']);
  });

  test('with the timeout fallback, callbacks run after 35 ms when no frame comes, and only once', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const withFallback = vi.fn();
    const withoutFallback = vi.fn();

    fastRaf(withoutFallback);
    fastRaf(withFallback, true);

    vi.advanceTimersByTime(FAST_RAF_FALLBACK_MS - 1);
    expect(withFallback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(withFallback).toHaveBeenCalledTimes(1);
    expect(withoutFallback).not.toHaveBeenCalled();

    frames.forEach((frame) => frame(performance.now()));
    expect(withFallback).toHaveBeenCalledTimes(1);
    expect(withoutFallback).toHaveBeenCalledTimes(1);
  });

  test('a frame that comes first cancels the fallback timeout', () => {
    const callback = vi.fn();
    fastRaf(callback, true);

    vi.advanceTimersToNextFrame();
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(FAST_RAF_FALLBACK_MS * 2);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('onIdle', () => {
  test('falls back to `onTickEnd` without `requestIdleCallback`', async () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    const callback = vi.fn();

    onIdle(callback);
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('runs callbacks while the idle period lasts and keeps the rest, in order, for the next one', () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback, options: IdleRequestOptions) => {
      expect(options).toEqual({ timeout: 500 });
      idleCallbacks.push(cb);
      return idleCallbacks.length;
    });
    const log: string[] = [];
    onIdle(() => log.push('a'));
    onIdle(() => log.push('b'));
    onIdle(() => log.push('c'));
    expect(idleCallbacks).toHaveLength(1);

    let remaining = 1;
    idleCallbacks.shift()!({ didTimeout: false, timeRemaining: () => remaining-- });
    expect(log).toEqual(['a', 'b']);
    expect(idleCallbacks).toHaveLength(1);

    idleCallbacks.shift()!({ didTimeout: false, timeRemaining: () => 10 });
    expect(log).toEqual(['a', 'b', 'c']);
  });
});
