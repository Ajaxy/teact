// T-ime: IME composition in controlled inputs.
// Chromium drives a real IME composition through CDP (`Input.imeSetComposition`); every browser also runs the same
// cases with synthetic composition events, since Firefox and WebKit have no CDP in Vitest's Playwright provider.
import type { ChangeEvent } from 'react';
import { useState } from '@teact/core';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { cdp, server, userEvent } from 'vitest/browser';

import { flushFrames } from '../utils/frames';
import { mount, unmountAll } from '../utils/mount';

const IS_CHROMIUM = server.browser === 'chromium';

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  await unmountAll();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

type Accept = ((value: string) => string) | undefined;

function renderInput(accept: Accept) {
  const events: string[] = [];

  function Input() {
    const [value, setValue] = useState('abc');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (accept) setValue(accept(e.currentTarget.value));
    };

    return (
      <input
        value={value}
        onChange={handleChange}
        onCompositionStart={() => events.push('compositionstart')}
        onCompositionEnd={() => events.push('compositionend')}
      />
    );
  }

  const input = mount(<Input />).querySelector('input')!;

  return { input, events };
}

const identity = (value: string) => value;
const toUpperCase = (value: string) => value.toUpperCase();

describe('IME composition with synthetic events (T-ime)', () => {
  function compose(input: HTMLInputElement, steps: string[], committed: string) {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    for (const step of steps) {
      input.value = `abc${step}`;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    }

    return async () => {
      input.value = `abc${committed}`;
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: committed }));
      await flushFrames();
    };
  }

  test.each([
    ['accepted', identity, 'abcか'],
    ['transformed', toUpperCase, 'ABCか'],
    ['rejected', undefined, 'abc'],
  ] as const)('a %s composition is not overwritten until it ends', async (_, accept, expected) => {
    const { input } = renderInput(accept);

    const end = compose(input, ['k'], 'か');
    await flushFrames();
    expect(input.value).toBe('abck');

    input.value = 'abcか';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await flushFrames();
    expect(input.value).toBe('abcか');

    await end();
    expect(input.value).toBe(expected);
  });
});

describe.runIf(IS_CHROMIUM)('IME composition through CDP (T-ime, Chromium)', () => {
  async function composeWithIme(input: HTMLInputElement) {
    await userEvent.click(input);
    input.setSelectionRange(3, 3);

    const session = cdp();
    const values: string[] = [];

    for (const [text, caret] of [['k', 1], ['ka', 2], ['か', 1]] as const) {
      await session.send('Input.imeSetComposition', { text, selectionStart: caret, selectionEnd: caret });
      await flushFrames();
      values.push(input.value);
    }

    await session.send('Input.insertText', { text: 'か' });
    await flushFrames();

    return values;
  }

  test('an accepted composition is not interrupted by re-renders', async () => {
    const { input, events } = renderInput(identity);

    expect(await composeWithIme(input)).toEqual(['abck', 'abcka', 'abcか']);
    expect(input.value).toBe('abcか');
    expect(events).toEqual(['compositionstart', 'compositionend']);
  });

  test('a transformed composition is applied once it ends', async () => {
    const { input, events } = renderInput(toUpperCase);

    expect(await composeWithIme(input)).toEqual(['abck', 'abcka', 'abcか']);
    expect(input.value).toBe('ABCか');
    expect(events).toEqual(['compositionstart', 'compositionend']);
  });

  test('a rejected composition is reverted once it ends', async () => {
    const { input, events } = renderInput(undefined);

    expect(await composeWithIme(input)).toEqual(['abck', 'abcka', 'abcか']);
    expect(input.value).toBe('abc');
    expect(events).toEqual(['compositionstart', 'compositionend']);
  });
});
