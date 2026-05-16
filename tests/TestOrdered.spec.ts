import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function assertOrder(page: Page, expectedOrder: number[]) {
  const lis = await page.locator('li').all();
  const values: number[] = [];

  for (const li of lis) {
    const input = li.locator('input[type="text"]');
    const value = await input.inputValue();
    if (value) {
      values.push(Number(value));
    }
  }

  expect(values).toEqual(expectedOrder);
}

test('TestOrdered: items maintain order with teactFastList and teactOrderKey', async ({ page, navigateToTest }) => {
  await navigateToTest('TestOrdered');

  await page.waitForSelector('ul li input[type="text"]');

  await assertOrder(page, [1, 5, 10]);

  await page.locator('input[type="text"]').first().fill('7');
  await page.locator('input[type="submit"][value="Insert Ordered"]').click();
  await page.waitForTimeout(100);
  await assertOrder(page, [1, 5, 7, 10]);

  await page.locator('input[type="text"]').first().fill('3');
  await page.locator('input[type="submit"][value="Insert Ordered"]').click();
  await page.waitForTimeout(100);
  await assertOrder(page, [1, 3, 5, 7, 10]);

  await page.locator('input[type="submit"][value="Add Bigs"]').click();
  await page.waitForTimeout(100);
  await assertOrder(page, [1, 3, 5, 7, 10, 105, 110, 120]);

  await page.locator('input[type="submit"][value="Add Smalls"]').click();
  await page.waitForTimeout(100);
  await assertOrder(page, [-20, -10, -5, 1, 3, 5, 7, 10, 105, 110, 120]);
});
