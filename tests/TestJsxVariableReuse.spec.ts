import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function checkElementOrder(page: Page, expectedOrder: string[]) {
  const buttons = await page.locator('button').allTextContents();
  expect(buttons).toEqual(expectedOrder);
}

test('TestJsxVariableReuse: JSX variable can be rendered in multiple locations', async ({ page, navigateToTest }) => {
  await navigateToTest('TestJsxVariableReuse');

  await checkElementOrder(page, ['Increment', 'Increment', 'Increment', 'Toggle first reuse']);

  await page.locator('button:has-text("Toggle first reuse")').click();
  await page.waitForTimeout(100);

  await checkElementOrder(page, ['Increment', 'Increment', 'Toggle first reuse']);

  await page.locator('button:has-text("Toggle first reuse")').click();
  await page.waitForTimeout(100);

  await checkElementOrder(page, ['Increment', 'Increment', 'Increment', 'Toggle first reuse']);
});
