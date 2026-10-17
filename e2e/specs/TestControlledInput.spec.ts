// Checks the exact DOM values and texts, keyboard typing with the caret position, the rejected checkbox, and IME
// composition (Chromium).
// TestControlledInput.tsx is Web A's verbatim copy; its `teactExperimentControlled` prop no longer has any effect,
// since inputs with `value` or `checked` are always controlled.
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

function getControlledInput(page: Page) {
  return page.locator('#test-root > div').nth(1).locator('input');
}

function getInputValueText(page: Page) {
  return page.locator('#test-root > div').nth(1).locator('div');
}

function getCheckbox(page: Page, label: RegExp) {
  return page.locator('label').filter({ hasText: label }).locator('input');
}

function getSelection(page: Page) {
  return getControlledInput(page).evaluate((input: HTMLInputElement) => (
    [input.value, input.selectionStart, input.selectionEnd]
  ));
}

test('TestControlledInput: an uncontrolled input keeps what is typed', async ({ page, navigateToTest }) => {
  await navigateToTest('TestControlledInput');

  const input = page.locator('#test-root > div').nth(0).locator('input');
  await expect(input).toHaveValue('Uncontrolled');
  await input.fill('typed');
  await expect(input).toHaveValue('typed');
});

test('TestControlledInput: the controlled input shows the state, which has no vowels', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestControlledInput');

  const input = getControlledInput(page);
  await expect(input).toHaveValue('Controlled');
  await expect(getInputValueText(page)).toHaveText('Input value:Controlled');

  for (const [typed, expected] of [['hello', 'hll'], ['beautiful', 'btfl'], ['xyz', 'xyz']]) {
    await input.fill(typed);
    await expect(input).toHaveValue(expected);
    await expect(getInputValueText(page)).toHaveText(`Input value:${expected}`);
  }
});

test('TestControlledInput: a rejected keystroke mid-text currently leaves the caret one character right', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestControlledInput');

  const input = getControlledInput(page);
  await input.fill('');
  await input.pressSequentially('hello');
  await expect(input).toHaveValue('hll');
  await expect.poll(() => getSelection(page)).toEqual(['hll', 3, 3]);

  // KNOWN ISSUE K1 (pinned in B2; fix in 0.2 or later, see KNOWN-ISSUES.md): after a rejected vowel in the middle,
  // the caret is restored to where it was after the keystroke, one character to the right. Expected: 1, then `hxll`
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(1, 1));
  await page.keyboard.type('a');
  await expect.poll(() => getSelection(page)).toEqual(['hll', 2, 2]);

  await page.keyboard.type('x');
  await expect.poll(() => getSelection(page)).toEqual(['hlxl', 3, 3]);
  await expect(getInputValueText(page)).toHaveText('Input value:hlxl');
});

test('TestControlledInput: a checkbox click that the state rejects is reverted', async ({ page, navigateToTest }) => {
  await navigateToTest('TestControlledInput');

  const isAllowed = getCheckbox(page, /Is allowed/);
  const isChecked = getCheckbox(page, /Is checked/);
  const value = page.locator('#test-root > div').filter({ hasText: /^Checkbox value:/ });
  await expect(value).toHaveText('Checkbox value:true');
  await expect(isAllowed).toBeChecked();
  await expect(isChecked).toBeChecked();

  // `defaultChecked`: uncontrolled
  await isAllowed.click();
  await expect(isAllowed).not.toBeChecked();

  await isChecked.click();
  await expect(isChecked).toBeChecked();
  await expect(value).toHaveText('Checkbox value:true');

  await isAllowed.click();
  await expect(isAllowed).toBeChecked();
  await isChecked.click();
  await expect(isChecked).not.toBeChecked();
  await expect(value).toHaveText('Checkbox value:false');

  await isChecked.click();
  await expect(isChecked).toBeChecked();
  await expect(value).toHaveText('Checkbox value:true');
});

test('TestControlledInput: an IME composition is not interrupted and is filtered once it ends', async ({
  page, navigateToTest, browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Drives the IME through the Chrome DevTools Protocol');
  await navigateToTest('TestControlledInput');

  const input = getControlledInput(page);
  await input.fill('');
  await expect(getInputValueText(page)).toHaveText('Input value:');
  await input.focus();

  const cdp = await page.context().newCDPSession(page);
  // The vowel in `ka` is not removed while composing
  for (const [text, caret, expected] of [['k', 1, 'k'], ['ka', 2, 'ka'], ['か', 1, 'か']] as const) {
    await cdp.send('Input.imeSetComposition', { text, selectionStart: caret, selectionEnd: caret });
    await expect(input).toHaveValue(expected);
  }
  await cdp.send('Input.insertText', { text: 'か' });
  await expect(input).toHaveValue('か');
  await expect(getInputValueText(page)).toHaveText('Input value:か');

  // A composed vowel is removed when the composition ends
  await cdp.send('Input.imeSetComposition', { text: 'あ', selectionStart: 1, selectionEnd: 1 });
  await expect(input).toHaveValue('かあ');
  await cdp.send('Input.insertText', { text: 'a' });
  await expect(input).toHaveValue('か');
  await expect(getInputValueText(page)).toHaveText('Input value:か');
});
