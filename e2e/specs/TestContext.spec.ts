// Checks the value that every consumer renders, in document order, after each step, and the logged values of the
// nested consumers
import type { ConsoleMessage, Page } from '@playwright/test';

import { expect, test } from './fixtures';

// The own text of every ContextConsumer (each one renders its children after its text), in document order
function getConsumerValues(page: Page) {
  return page.locator('#test-root div[style*="color: red"]').evaluateAll((elements) => (
    elements.map((element) => element.firstChild!.textContent!.replace('Current context value: ', ''))
  ));
}

// `ContextConsumer A` to `C` log `ContextConsumer <key>` and their value
function getLoggedValues(messages: ConsoleMessage[]) {
  return Promise.all(messages
    .filter((message) => message.text().startsWith('ContextConsumer '))
    .map(async (message) => `${message.text().split(' ')[1]}=${await message.args()[1].jsonValue()}`));
}

function expectedValues(value: string, isSwapped = false) {
  const outer = isSwapped ? 'default value' : value;

  return [
    'default value', // outside the provider
    outer, outer, outer, // A > B > C
    `sibling ${value}`,
    outer, // inside a memo wrapper
    outer, outer, // in a fragment
    `fastlist ${value}`, `fastlist ${value}`,
    'overriden value',
  ];
}

test('TestContext: providers supply values to every consumer below them', async ({
  page, navigateToTest, consoleMessages,
}) => {
  await navigateToTest('TestContext');

  const [first] = (await getConsumerValues(page)).slice(1, 2);
  await expect.poll(() => getConsumerValues(page)).toEqual(expectedValues(first));
  await expect.poll(() => getLoggedValues(consoleMessages)).toEqual([`A=${first}`, `B=${first}`, `C=${first}`]);
  await expect(page.getByText('Fast list item')).toBeVisible();

  consoleMessages.splice(0);
  await page.getByRole('button', { name: 'Change context value' }).click();
  await expect.poll(async () => (await getConsumerValues(page))[1]).not.toBe(first);
  const second = (await getConsumerValues(page))[1];
  await expect.poll(() => getConsumerValues(page)).toEqual(expectedValues(second));
  await expect.poll(async () => (await getLoggedValues(consoleMessages)).slice(-3))
    .toEqual([`A=${second}`, `B=${second}`, `C=${second}`]);

  // The outer provider is replaced with a plain component: consumers below it fall back to the default value
  consoleMessages.splice(0);
  await page.getByRole('button', { name: 'Swap context wrapper' }).click();
  await expect(page.locator('#test-root div[style*="border"]')).toContainText(`Swapped ${second}`);
  await expect.poll(() => getConsumerValues(page)).toEqual(expectedValues(second, true));
  await expect(page.getByText('Fast list item')).toHaveCount(0);
  await expect.poll(async () => (await getLoggedValues(consoleMessages)).slice(-3))
    .toEqual(['A=default value', 'B=default value', 'C=default value']);

  await page.getByRole('button', { name: 'Swap context wrapper' }).click();
  await expect(page.locator('#test-root div[style*="border"]')).toHaveCount(0);
  await expect.poll(() => getConsumerValues(page)).toEqual(expectedValues(second));
  await expect(page.getByText('Fast list item')).toBeVisible();
});
