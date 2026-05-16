import { test, expect } from './fixtures';

test('TestFragment: ref should not change on state update', async ({ page, navigateToTest }) => {
  await navigateToTest('TestFragment');

  const initialRefText = await page.locator('text=This number should never change:').textContent();
  const initialRef = initialRefText?.match(/(\d+)$/)?.[1];
  expect(initialRef).toBeTruthy();

  await page.click('text=Click to update');

  await expect(page.locator('span:has-text("fragment")')).toBeVisible();

  const afterRefText = await page.locator('text=This number should never change:').textContent();
  const afterRef = afterRefText?.match(/(\d+)$/)?.[1];
  expect(afterRef).toBe(initialRef);

  await page.click('text=Click to update');
  await expect(page.locator('span:has-text("fragment")')).not.toBeVisible();

  const finalRefText = await page.locator('text=This number should never change:').textContent();
  const finalRef = finalRefText?.match(/(\d+)$/)?.[1];
  expect(finalRef).toBe(initialRef);
});
