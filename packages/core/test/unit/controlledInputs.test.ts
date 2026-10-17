// Ported from Telegram Web A's tests/teactControlledInputs.test.ts (Ajaxy/telegram-t#7422, 83c5a15d91), which came
// with the controlled-inputs change in packages/core/src/lib/teact/teact-dom.ts. Changes: imports from the package.
import type { ChangeEvent } from 'react';
import type { VirtualElement } from '@teact/core';
import { beginHeavyAnimation, createElement, useState } from '@teact/core';
import TeactDOM from '@teact/core/dom';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

type StatefulInputProps = {
  initialValue: string;
  transform?: (value: string) => string;
  onChange?: (value: string) => void;
  onInput?: () => void;
};

let root: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();

  root = document.createElement('div');
  document.body.appendChild(root);
});

afterEach(async () => {
  TeactDOM.render(undefined, root);
  await flushRender();

  root.remove();
  vi.useRealTimers();
});

describe('Controlled text input', () => {
  test('Keeps the typed value when `onChange` updates the state', async () => {
    const onChange = vi.fn();
    const input = renderInput(createElement(StatefulInput, { initialValue: 'a', onChange }));

    typeValue(input, 'ab');
    await flushRender();

    expect(input.value).toBe('ab');
    expect(onChange).toHaveBeenCalledWith('ab');
  });

  test('Reverts the typed value when `onChange` ignores it', async () => {
    const onChange = vi.fn();
    const input = renderInput(createElement('input', { value: 'fixed', onChange }));

    typeValue(input, 'fixedX');
    expect(input.value).toBe('fixedX');

    await flushRender();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('fixed');
  });

  test('Calls `onChange` on `input` events, not on `change` events', async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const input = renderInput(createElement(StatefulInput, { initialValue: '', onChange, onInput }));

    typeValue(input, 'a');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(1);

    await flushRender();
    expect(input.value).toBe('a');
  });

  test('Keeps the caret in place when the state transforms the value', async () => {
    const input = renderInput(createElement(StatefulInput, { initialValue: 'abc', transform: toUpperCase }));
    expect(input.value).toBe('ABC');

    input.value = 'AxBC';
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushRender();

    expect(input.value).toBe('AXBC');
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);
  });

  test('Does not overwrite the value during IME composition', async () => {
    const input = renderInput(createElement(StatefulInput, { initialValue: '', transform: toUpperCase }));

    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));

    typeValue(input, 'k', true);
    await flushRender();
    expect(input.value).toBe('k');

    typeValue(input, 'ka', true);
    await flushRender();
    expect(input.value).toBe('ka');

    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ka' }));
    await flushRender();

    expect(input.value).toBe('KA');
  });

  test('Waits for heavy animations to end before reverting the typed value', async () => {
    const input = renderInput(createElement('input', { value: 'fixed', onChange: noop }));
    const endHeavyAnimation = beginHeavyAnimation(10000);

    typeValue(input, 'fixedX');
    await vi.advanceTimersByTimeAsync(100);
    expect(input.value).toBe('fixedX');

    endHeavyAnimation();
    await flushRender();

    expect(input.value).toBe('fixed');
  });

  test('Does not rewrite a numeric value on unrelated renders', async () => {
    const input = renderInput(createElement('input', { value: 12345, onChange: noop }));

    // An `input` event saves the caret position (at the end), then the caret is moved without one
    typeValue(input, '12345');
    await flushRender();
    input.setSelectionRange(2, 2);

    render(createElement('input', { value: 12345, className: 'rerendered', onChange: noop }));
    await flushRender();

    expect(input.className).toBe('rerendered');
    expect(input.selectionStart).toBe(2);
  });

  test('Switches between uncontrolled and controlled when `value` is added or removed', async () => {
    const input = renderInput(createElement('input', { onChange: noop }));

    typeValue(input, 'typed');
    await flushRender();
    expect(input.value).toBe('typed');

    render(createElement('input', { value: 'controlled', onChange: noop }));
    await flushRender();
    expect(input.value).toBe('controlled');

    typeValue(input, 'controlledX');
    await flushRender();
    expect(input.value).toBe('controlled');
  });
});

describe('Controlled checkable inputs', () => {
  test('Keeps the toggle when `onChange` updates the state', async () => {
    const input = renderInput(createElement(StatefulCheckbox, {}));

    input.click();
    await flushRender();
    expect(input.checked).toBe(true);

    input.click();
    await flushRender();
    expect(input.checked).toBe(false);
  });

  test('Reverts the toggle when `onChange` ignores it', async () => {
    const onChange = vi.fn();
    const input = renderInput(createElement('input', { type: 'checkbox', checked: false, onChange }));

    input.click();
    expect(input.checked).toBe(true);

    await flushRender();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(false);
  });

  test('Restores the checked radio of a group when the click is ignored', async () => {
    render(createElement(
      'div',
      {},
      createElement('input', {
        type: 'radio', name: 'group', value: 'x', checked: true, onChange: noop,
      }),
      createElement('input', {
        type: 'radio', name: 'group', value: 'y', checked: false, onChange: noop,
      }),
    ));
    const [radioX, radioY] = Array.from(root.querySelectorAll('input'));

    radioY.click();
    expect(radioX.checked).toBe(false);

    await flushRender();

    expect(radioY.checked).toBe(false);
    expect(radioX.checked).toBe(true);
  });

  test('Does not undo an accepted click because of another group with the same name', async () => {
    render(createElement(
      'div',
      {},
      createElement(StatefulRadioGroup, {}),
      createElement('input', {
        type: 'radio', name: 'stateful-group', value: 'other', checked: true, onChange: noop,
      }),
    ));
    const [, radioY] = Array.from(root.querySelectorAll('input'));

    radioY.click();
    await flushRender();

    expect(radioY.checked).toBe(true);
  });

  test('Keeps the clicked radio of a group when `onChange` updates the state', async () => {
    render(createElement(StatefulRadioGroup, {}));
    const [radioX, radioY] = Array.from(root.querySelectorAll('input'));

    radioY.click();
    await flushRender();

    expect(radioY.checked).toBe(true);
    expect(radioX.checked).toBe(false);
  });
});

describe('Controlled select', () => {
  test('Keeps the selected option when `onChange` updates the state', async () => {
    const onChange = vi.fn();
    const select = renderSelect(createElement(StatefulSelect, { onChange }));

    selectValue(select, 'b');
    await flushRender();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
    expect(select.value).toBe('b');
  });

  test('Reverts the selected option when `onChange` ignores it', async () => {
    const select = renderSelect(buildSelect('a', noop));

    selectValue(select, 'b');
    await flushRender();

    expect(select.value).toBe('a');
  });
});

describe('Uncontrolled inputs', () => {
  test('Apply `defaultValue` on mount and keep user edits across renders', async () => {
    const onChange = vi.fn();
    const input = renderInput(createElement('input', { defaultValue: 'initial', onChange }));
    expect(input.value).toBe('initial');

    typeValue(input, 'typed');
    await flushRender();

    render(createElement('input', { defaultValue: 'initial', className: 'rerendered', onChange }));
    await flushRender();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.className).toBe('rerendered');
    expect(input.value).toBe('typed');
  });

  test('Apply `defaultChecked` on mount and keep user toggles across renders', async () => {
    const input = renderInput(createElement('input', { type: 'checkbox', defaultChecked: true }));
    expect(input.checked).toBe(true);

    input.click();
    await flushRender();

    render(createElement('input', { type: 'checkbox', defaultChecked: true, className: 'rerendered' }));
    await flushRender();

    expect(input.className).toBe('rerendered');
    expect(input.checked).toBe(false);
  });
});

function StatefulInput({
  initialValue,
  transform,
  onChange,
  onInput,
}: StatefulInputProps) {
  const [value, setValue] = useState(() => (transform ? transform(initialValue) : initialValue));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    onChange?.(newValue);
    setValue(transform ? transform(newValue) : newValue);
  };

  return createElement('input', { value, onChange: handleChange, onInput });
}

function StatefulCheckbox() {
  const [isChecked, setIsChecked] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.currentTarget.checked);
  };

  return createElement('input', { type: 'checkbox', checked: isChecked, onChange: handleChange });
}

function StatefulRadioGroup() {
  const [selected, setSelected] = useState('x');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelected(e.currentTarget.value);
  };

  return createElement(
    'div',
    {},
    ['x', 'y'].map((value) => createElement('input', {
      key: value, type: 'radio', name: 'stateful-group', value, checked: selected === value, onChange: handleChange,
    })),
  );
}

function StatefulSelect({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('a');

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.currentTarget.value);
    setValue(e.currentTarget.value);
  };

  return buildSelect(value, handleChange);
}

function buildSelect(value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void) {
  return createElement(
    'select',
    { value, onChange },
    createElement('option', { value: 'a' }, 'A'),
    createElement('option', { value: 'b' }, 'B'),
  );
}

function render(element: ReturnType<typeof createElement>) {
  TeactDOM.render(element as VirtualElement, root);
}

function renderInput(element: ReturnType<typeof createElement>) {
  render(element);
  return root.querySelector('input')!;
}

function renderSelect(element: ReturnType<typeof createElement>) {
  render(element);
  return root.querySelector('select')!;
}

function typeValue(input: HTMLInputElement, value: string, isComposing?: boolean) {
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing }));
}

function selectValue(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

// Runs Teact's update pass, which is scheduled with `requestAnimationFrame` and promise chains
async function flushRender() {
  await vi.runAllTimersAsync();
}

function toUpperCase(value: string) {
  return value.toUpperCase();
}

function noop() {}
