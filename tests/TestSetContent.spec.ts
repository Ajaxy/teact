import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function assertContent(page: Page, firstLine: boolean) {
  const html = await page.content();
  if (firstLine) {
    expect(html).toContain('First line');
  } else {
    expect(html).not.toContain('First line');
  }
  expect(html).toContain('text component');
  expect(html).toContain('Last line');
}

test('TestSetContent: text nodes adjacent to text component', async ({ page, navigateToTest }) => {
  await navigateToTest('TestSetContent');

  await assertContent(page, true);

  const clickableDiv = page.locator('h2:text("TestSetContent")').locator('..').locator('div').nth(1);

  await clickableDiv.click();
  await page.waitForTimeout(100);

  await assertContent(page, false);

  await clickableDiv.click();
  await page.waitForTimeout(100);

  await assertContent(page, true);
});
