// T-ctl and T-radio: controlled inputs with `value` or `checked`, reconciled after the update pass
import type { ChangeEvent } from 'react';
import { useEffect, useLayoutEffect, useState } from '@teact/core';
import { requestAfterRender } from '@teact/core/internal';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { flushFrames, runFrame } from '../utils/frames';
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

function TextInput({ initialValue, accept }: { initialValue: string; accept?: (value: string) => string }) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (accept) setValue(accept(e.currentTarget.value));
  };

  return <input value={value} onChange={handleChange} />;
}

function typeValue(input: HTMLInputElement, value: string, caret = value.length) {
  input.value = value;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function removeVowels(value: string) {
  return value.replace(/[aeiou]/g, '');
}

describe('Controlled text input (T-ctl)', () => {
  test('an accepted edit stays', async () => {
    const input = mount(<TextInput initialValue="abc" accept={(value) => value} />).querySelector('input')!;

    typeValue(input, 'abcX');
    expect(input.value).toBe('abcX');
    await flushFrames();
    expect(input.value).toBe('abcX');
  });

  test('a rejected edit stays visible until the update pass, then the value is restored', async () => {
    const input = mount(<TextInput initialValue="abc" />).querySelector('input')!;

    typeValue(input, 'abcX');
    expect(input.value).toBe('abcX');
    expect(await runFrame()).toBe(true);
    expect(input.value).toBe('abc');
  });

  test('a transformed edit keeps the caret in place', async () => {
    const input = mount(<TextInput initialValue="abc" accept={(value) => value.toUpperCase()} />)
      .querySelector('input')!;

    typeValue(input, 'abXc', 3);
    expect([input.value, input.selectionStart]).toEqual(['abXc', 3]);
    await flushFrames();
    expect([input.value, input.selectionStart, input.selectionEnd]).toEqual(['ABXC', 3, 3]);
  });

  test('a re-render with the same value restores an edit made without an event', async () => {
    let setOther!: (value: number) => void;

    function Form() {
      const [other, setOtherState] = useState(0);
      setOther = setOtherState;

      return (
        <div>
          <input value="fixed" />
          {other}
        </div>
      );
    }

    const container = mount(<Form />);
    const input = container.querySelector('input')!;

    input.value = 'edited';
    setOther(1);
    await flushFrames();
    expect(container.textContent).toBe('1');
    expect(input.value).toBe('fixed');
  });

  test('keyboard typing into a filtering input: a rejected keystroke mid-text currently leaves the caret one '
    + 'character to the right', async () => {
    const input = mount(<TextInput initialValue="" accept={removeVowels} />).querySelector('input')!;

    await userEvent.type(input, 'hello');
    await flushFrames();
    expect([input.value, input.selectionStart]).toEqual(['hll', 3]);

    // KNOWN ISSUE K1 (pinned in B2; fix in 0.2 or later, see KNOWN-ISSUES.md): after a rejected keystroke in the
    // middle, the value is restored, but the caret is restored to where it was after the keystroke (the selection
    // saved on `input`), one character to the right. Expected: caret 1, then `hxll`
    input.setSelectionRange(1, 1);
    await userEvent.keyboard('a');
    await flushFrames();
    expect([input.value, input.selectionStart, input.selectionEnd]).toEqual(['hll', 2, 2]);

    await userEvent.keyboard('x');
    await flushFrames();
    expect([input.value, input.selectionStart]).toEqual(['hlxl', 3]);
  });

  test('after-render callbacks run after the update and its layout effects, before passive effects', async () => {
    const log: string[] = [];

    function Input() {
      const [value, setValue] = useState('a');
      log.push(`render:${value}`);

      useLayoutEffect(() => {
        log.push(`layout:${value}`);
      }, [value]);
      useEffect(() => {
        log.push(`passive:${value}`);
      }, [value]);

      const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.currentTarget.value.toUpperCase());
        requestAfterRender(() => {
          log.push(`after-render:${input.value}`);
        });
      };

      return <input value={value} onChange={handleChange} />;
    }

    const input = mount(<Input />).querySelector('input')!;
    await flushFrames();
    log.splice(0);

    typeValue(input, 'ab');
    await flushFrames();

    // After-render callbacks run in the frame of the update, once its layout effects have run
    expect(log).toEqual(['render:AB', 'layout:AB', 'after-render:AB', 'passive:AB']);
    expect(input.value).toBe('AB');
  });

  test('`onChange` is called for `input` events and not for `change` events', async () => {
    const onChange = vi.fn();
    const input = mount(<input value="a" onChange={onChange} />).querySelector('input')!;

    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();

    typeValue(input, 'ab');
    expect(onChange).toHaveBeenCalledTimes(1);
    await flushFrames();
    expect(input.value).toBe('a');
  });
});

describe('Controlled checkboxes and radios (T-radio)', () => {
  function Checkbox({ isAllowed }: { isAllowed: boolean }) {
    const [isChecked, setIsChecked] = useState(false);

    return (
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          if (isAllowed) setIsChecked(e.currentTarget.checked);
        }}
      />
    );
  }

  function RadioGroup({ isAllowed }: { isAllowed: boolean }) {
    const [selected, setSelected] = useState('x');

    return (
      <form>
        {['x', 'y', 'z'].map((value) => (
          <input
            key={value}
            type="radio"
            name="group"
            value={value}
            checked={selected === value}
            onChange={(e) => {
              if (isAllowed) setSelected(e.currentTarget.value);
            }}
          />
        ))}
      </form>
    );
  }

  function checkedStates(container: HTMLElement) {
    return Array.from(container.querySelectorAll('input'), (input) => input.checked);
  }

  test('a rejected checkbox click reverts within the next frame', async () => {
    const container = mount(<Checkbox isAllowed={false} />);
    const checkbox = container.querySelector('input')!;

    await userEvent.click(checkbox);
    await runFrame();
    expect(checkbox.checked).toBe(false);
    await flushFrames();
    expect(checkbox.checked).toBe(false);
  });

  test('an accepted checkbox click stays', async () => {
    const container = mount(<Checkbox isAllowed />);
    const checkbox = container.querySelector('input')!;

    await userEvent.click(checkbox);
    await flushFrames();
    expect(checkbox.checked).toBe(true);

    await userEvent.click(checkbox);
    await flushFrames();
    expect(checkbox.checked).toBe(false);
  });

  test('a rejected click in a radio group restores the checked radio', async () => {
    const container = mount(<RadioGroup isAllowed={false} />);
    const radios = container.querySelectorAll('input');

    await userEvent.click(radios[1]);
    await runFrame();
    expect(checkedStates(container)).toEqual([true, false, false]);
    await flushFrames();
    expect(checkedStates(container)).toEqual([true, false, false]);
  });

  test('an accepted click in a radio group moves the selection', async () => {
    const container = mount(<RadioGroup isAllowed />);
    const radios = container.querySelectorAll('input');

    await userEvent.click(radios[2]);
    await flushFrames();
    expect(checkedStates(container)).toEqual([false, false, true]);

    await userEvent.click(radios[0]);
    await flushFrames();
    expect(checkedStates(container)).toEqual([true, false, false]);
  });
});
