import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  navigateToTest: (testName: string) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  navigateToTest: async ({ page }, use) => {
    const navigateToTest = async (testName: string) => {
      await page.goto('/');
      await page.click(`text=${testName}`);
    };
    await use(navigateToTest);
  },
});

export { expect };
