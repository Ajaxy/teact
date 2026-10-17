// Ported from Ajaxy/teact#6 by @muhin-g-s (tests/fixtures.ts). Changes: `navigateToTest` opens `?test=<Name>` instead
// of clicking through the index page; console messages and page errors are collected, and any error fails the test
// unless it opts in with `test.use({ allowPageErrors: true })`.
import {
  type ConsoleMessage, expect, type Locator, test as base,
} from '@playwright/test';

type TestOptions = {
  allowPageErrors: boolean;
};

type TestFixtures = {
  navigateToTest: (testName: string) => Promise<void>;
  // Every console message of the page, in order
  consoleMessages: ConsoleMessage[];
  // Texts of `console.error` messages and uncaught page errors
  pageErrors: string[];
};

export const test = base.extend<TestOptions & TestFixtures>({
  allowPageErrors: [false, { option: true }],

  consoleMessages: async ({ page }, provide) => {
    const messages: ConsoleMessage[] = [];
    page.on('console', (message) => messages.push(message));
    await provide(messages);
  },

  pageErrors: [async ({ page, allowPageErrors }, provide) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(`Uncaught: ${error.message}`));

    await provide(errors);

    if (!allowPageErrors) {
      expect(errors, 'Errors in the page').toEqual([]);
    }
  }, { auto: true }],

  navigateToTest: async ({ page }, provide) => {
    await provide(async (testName: string) => {
      await page.goto(`?test=${testName}`);
      await expect(page.locator('html')).toHaveAttribute('data-test', testName);
    });
  },
});

export { expect };

/** Texts of the console messages that match `filter` (dev-build warnings such as slow renders can come in between) */
export function logTexts(messages: ConsoleMessage[], filter: RegExp) {
  return messages.map((message) => message.text()).filter((text) => filter.test(text));
}

/** Marks the elements a locator matches, so that `areMarked()` can tell later whether they are still the same nodes */
export async function markNodes(locator: Locator, mark = 'e2eMark') {
  await locator.evaluateAll((elements, name) => {
    elements.forEach((element) => {
      (element as unknown as Record<string, boolean>)[name] = true;
    });
  }, mark);
}

/** For each element the locator matches now, whether `markNodes()` marked it */
export function areMarked(locator: Locator, mark = 'e2eMark') {
  return locator.evaluateAll((elements, name) => (
    elements.map((element) => Boolean((element as unknown as Record<string, boolean>)[name]))
  ), mark);
}

export type { ConsoleMessage, Locator, Page } from '@playwright/test';
