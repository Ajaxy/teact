import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

interface AssertNumbersOptions {
  page: Page;
  shouldContain: number[];
  shouldNotContain: number[];
}

async function assertNumbers({ page, shouldContain, shouldNotContain }: AssertNumbersOptions) {
  const html = await page.content();
  for (const num of shouldContain) {
    expect(html).toContain(`>${num}<`);
  }
  for (const num of shouldNotContain) {
    expect(html).not.toContain(`>${num}<`);
  }
}

test('TestNoContainer: containerless components render in order', async ({ page, navigateToTest }) => {
  await navigateToTest('TestNoContainer');

  assertNumbers({ page, shouldContain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], shouldNotContain: [] });

  await page.locator('span').filter({ hasText: '4' }).first().click();
  await page.waitForTimeout(100);

  await assertNumbers({ page, shouldContain: [1, 2, 3, 7, 8, 9, 10, 11, 12, 13], shouldNotContain: [4, 5, 6] });

  await page.waitForTimeout(1100);

  await assertNumbers({ page, shouldContain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], shouldNotContain: [] });

  await page.locator('span').filter({ hasText: '8' }).first().click();
  await page.waitForTimeout(100);

  await assertNumbers({ page, shouldContain: [1, 2, 3, 4, 5, 6, 8, 11, 12, 13], shouldNotContain: [7, 9, 10] });

  await page.waitForTimeout(1100);

  await assertNumbers({ page, shouldContain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], shouldNotContain: [] });

  await page.locator('span').filter({ hasText: '1' }).first().click();
  await page.waitForTimeout(100);

  await assertNumbers({ page, shouldContain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], shouldNotContain: [] });
});
