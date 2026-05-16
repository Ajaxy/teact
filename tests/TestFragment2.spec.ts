import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

test('TestFragment2: items toggle and sibling stays last', async ({ page, navigateToTest }) => {
  await navigateToTest('TestFragment2');

  await assertItems(page, [1, 2, 3], true);

  await page.click('[class="App"]');
  await page.waitForTimeout(100);

  await assertItems(page, [1, 2, 3], false);

  await page.click('[class="App"]');
  await page.waitForTimeout(100);

  await assertItems(page, [1, 2, 3], true);
});

async function assertItems(page: Page, items: number[], shouldBeVisible: boolean) {
  const html = await page.content();
  items.forEach(num => {
    if (shouldBeVisible) {
      expect(html).toContain(`>${num}<`);
    } else {
      expect(html).not.toContain(`>${num}<`);
    }
  });
  expect(html).toContain('This should always go last');
}
