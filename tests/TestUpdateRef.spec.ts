import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

interface AssertContentOptions {
  page: Page;
  shouldContain?: string[];
  shouldNotContain?: string[];
}

async function assertContent({ page, shouldContain = [], shouldNotContain = [] }: AssertContentOptions) {
  const html = await page.content();
  for (const text of shouldContain) {
    expect(html).toContain(text);
  }
  for (const text of shouldNotContain) {
    expect(html).not.toContain(text);
  }
}

test('TestUpdateRef: ref is reassigned when element swaps', async ({ page, navigateToTest }) => {
  await navigateToTest('TestUpdateRef');

  await assertContent({ page, shouldContain: ['First', 'Current: First'] });
  await assertContent({ page, shouldNotContain: ['Second'] });

  await page.locator('span').filter({ hasText: 'First' }).first().click();
  await page.waitForTimeout(100);

  await assertContent({ page, shouldContain: ['Second', 'Current: Second'] });
  await assertContent({ page, shouldNotContain: ['First'] });

  await page.locator('span').filter({ hasText: 'Second' }).first().click();
  await page.waitForTimeout(100);

  await assertContent({ page, shouldContain: ['First', 'Current: First'] });
  await assertContent({ page, shouldNotContain: ['Second'] });
});
