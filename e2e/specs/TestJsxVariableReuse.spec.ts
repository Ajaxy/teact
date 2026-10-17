// Checks that each rendering of the reused JSX element is a separate counter, and that hiding and showing the first
// one keeps the others
import type { Page } from '@playwright/test';

import {
  areMarked, expect, markNodes, test,
} from './fixtures';

function getCounters(page: Page) {
  return page.locator('#test-root > div > div');
}

test('TestJsxVariableReuse: a JSX element in a variable renders as independent counters', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestJsxVariableReuse');

  const counters = getCounters(page);
  const toggle = page.getByRole('button', { name: 'Toggle first reuse' });
  await expect(page.locator('#test-root button')).toHaveText([
    'Increment', 'Increment', 'Increment', 'Toggle first reuse',
  ]);
  await expect(counters.locator('span')).toHaveText(['Count: 0', 'Count: 0', 'Count: 0']);

  // The handlers read the rendered count, so each click waits for the previous render
  await counters.nth(0).getByRole('button').click();
  await counters.nth(2).getByRole('button').click();
  await expect(counters.locator('span')).toHaveText(['Count: 1', 'Count: 0', 'Count: 1']);
  await counters.nth(2).getByRole('button').click();
  await expect(counters.locator('span')).toHaveText(['Count: 1', 'Count: 0', 'Count: 2']);
  await markNodes(counters);

  await toggle.click();
  await expect(page.locator('#test-root button')).toHaveText(['Increment', 'Increment', 'Toggle first reuse']);
  await expect(counters.locator('span')).toHaveText(['Count: 0', 'Count: 2']);
  expect(await areMarked(counters)).toEqual([true, true]);

  await toggle.click();
  await expect(counters.locator('span')).toHaveText(['Count: 0', 'Count: 0', 'Count: 2']);
  expect(await areMarked(counters)).toEqual([false, true, true]);
});
