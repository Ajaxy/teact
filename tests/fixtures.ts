import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  navigateToTest: (testName: string) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  navigateToTest: async ({ page }, use) => {
    const navigateToTest = async (testName: string) => {
      await page.goto('/');
      await page.locator(`a:has-text("${testName}")`).first().click();
      await page.waitForSelector(`h2:has-text("${testName}")`);
    };
    await use(navigateToTest);
  },
});

export { expect };
