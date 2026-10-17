// T-signals (API): createSignal, isSignal, subscribe, once and cleanupEffect
import { cleanupEffect, createSignal, isSignal } from '@teact/core';
import { describe, expect, test, vi } from 'vitest';

describe('createSignal', () => {
  test('the getter returns the latest value; the setter notifies subscribers only on change', () => {
    const [getValue, setValue] = createSignal(1);
    const subscriber = vi.fn(() => getValue());
    getValue.subscribe(subscriber);

    expect(getValue()).toBe(1);
    setValue(1);
    expect(subscriber).not.toHaveBeenCalled();

    setValue(2);
    expect(getValue()).toBe(2);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveLastReturnedWith(2);
  });

  test('without a default value, the signal starts as `undefined`', () => {
    const [getValue] = createSignal<string>();

    expect(getValue()).toBeUndefined();
  });

  test('subscribers are called synchronously, in subscription order, and can unsubscribe', () => {
    const [getValue, setValue] = createSignal(0);
    const log: string[] = [];
    const unsubscribeA = getValue.subscribe(() => log.push(`a:${getValue()}`));
    getValue.subscribe(() => log.push(`b:${getValue()}`));

    setValue(1);
    unsubscribeA();
    setValue(2);

    expect(log).toEqual(['a:1', 'b:1', 'b:2']);
  });

  test('the same callback subscribes only once to a signal', () => {
    const [getValue, setValue] = createSignal(0);
    const subscriber = vi.fn();
    getValue.subscribe(subscriber);
    getValue.subscribe(subscriber);

    setValue(1);

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test('`once` runs its callback on the next change only, and can be cancelled', () => {
    const [getValue, setValue] = createSignal(0);
    const onceCallback = vi.fn();
    const cancelledCallback = vi.fn();
    getValue.once(onceCallback);
    const cancel = getValue.once(cancelledCallback);
    cancel();

    setValue(1);
    setValue(2);

    expect(onceCallback).toHaveBeenCalledTimes(1);
    expect(cancelledCallback).not.toHaveBeenCalled();
  });
});

describe('cleanupEffect', () => {
  test('unsubscribes a callback from every signal it is subscribed to', () => {
    const [getA, setA] = createSignal(0);
    const [getB, setB] = createSignal(0);
    const effect = vi.fn();
    const other = vi.fn();
    getA.subscribe(effect);
    getB.subscribe(effect);
    getA.subscribe(other);

    cleanupEffect(effect);
    setA(1);
    setB(1);

    expect(effect).not.toHaveBeenCalled();
    expect(other).toHaveBeenCalledTimes(1);
  });

  test('a callback can subscribe again after `cleanupEffect`, which can be called repeatedly', () => {
    const [getValue, setValue] = createSignal(0);
    const effect = vi.fn();
    getValue.subscribe(effect);

    cleanupEffect(effect);
    expect(() => cleanupEffect(effect)).not.toThrow();
    getValue.subscribe(effect);
    setValue(1);

    expect(effect).toHaveBeenCalledTimes(1);
  });
});

describe('isSignal', () => {
  test('recognises signal getters only', () => {
    const [getValue, setValue] = createSignal(0);

    expect(isSignal(getValue)).toBe(true);
    expect(isSignal(setValue)).toBe(false);
    expect(isSignal(() => 0)).toBe(false);
    expect(isSignal({ subscribe: () => undefined })).toBe(false);
    expect(isSignal(undefined)).toBe(false);
  });

  test('recognises a signal created by another copy of the module', async () => {
    vi.resetModules();
    const otherCopy = await import('@teact/core');
    const [getOther] = otherCopy.createSignal(0);
    const [getLocal] = createSignal(0);

    expect(otherCopy.isSignal).not.toBe(isSignal);
    expect(otherCopy.isSignal(getOther)).toBe(true);
    // The mark is the registered `Symbol.for('teact.signal')`, the same in every copy (H20/H21)
    expect(isSignal(getOther)).toBe(true);
    expect(otherCopy.isSignal(getLocal)).toBe(true);
    expect(Object.getOwnPropertySymbols(getLocal)).toEqual([Symbol.for('teact.signal')]);
  });
});
