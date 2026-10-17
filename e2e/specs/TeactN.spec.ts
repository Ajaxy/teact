// Web A's TeactN test components (Test, SubTest, ErrorTest, TestNoRedundancy) with the global stub
import type { ConsoleMessage } from '@playwright/test';

import { expect, logTexts, test } from './fixtures';

// The components show `Math.random()` values and throw when they are above 0.8. These values stay in [0.55, 0.56) and
// still differ from each other, since unique ids (TeactN container ids among them) are made with `Math.random()` too.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Math.random = () => 0.55 + ((calls++ % 1000) / 100000);
  });
});

const RANDOM = /0\.55\d*/;

test('SubTest: renders its props and its own state', async ({ page, navigateToTest }) => {
  await navigateToTest('SubTest');

  const box = page.locator('#test-root > div');
  await expect(box.locator('h3')).toHaveText('THIS IS `SubTest` Component');
  await expect(box.locator('> div')).toHaveText(['authState: !', 'parentRand: !', /^state value: 0!/]);

  await box.locator('input[type="button"]').click();
  await expect(box.locator('> div').nth(2)).toHaveText(/^state value: 1!/);
});

test.describe('errors', () => {
  test.use({ allowPageErrors: true });

  test('Test: errors in a mapper and in a render are reported and the rest of the page keeps working', async ({
    page, navigateToTest, pageErrors,
  }) => {
    await navigateToTest('Test');

    const subTest = page.locator('#test-root h3').filter({ hasText: 'SubTest' }).locator('..');
    await expect(page.locator('#test-root h2')).toHaveText('Test page');
    await expect(subTest.locator('> div')).toHaveText([
      'authState: authorizationStateReady!', new RegExp(`^parentRand: ${RANDOM.source}!$`), /^state value: 0!/,
    ]);
    // ErrorTest's mapper throws on its first call, then its render throws while `parentRand` is 0
    await expect(page.locator('#test-root').getByText('THIS IS `ErrorTest` Component')).toHaveCount(0);
    expect(pageErrors).toEqual([
      expect.stringContaining('test error `mapStateToProps`'),
      expect.stringMatching(/^\[Teact\] Error while rendering component /),
      expect.stringContaining('test error render'),
    ]);

    await subTest.locator('input[type="button"]').click();
    await expect(subTest.locator('> div').nth(2)).toHaveText(/^state value: 1!/);

    // Test sets its own random state after 3 seconds, and ErrorTest renders with it
    const errorTest = page.locator('#test-root h3').filter({ hasText: 'ErrorTest' }).locator('..');
    await expect(errorTest.locator('> div > div')).toHaveText([
      new RegExp(`^parent:${RANDOM.source}$`), new RegExp(`^global:${RANDOM.source}$`),
    ], { timeout: 5000 });
    expect(pageErrors).toHaveLength(3);
  });
});

// TestNoRedundancy logs `'!!! <A|B> <MAP|MOUNT>', props` from its mappers and renders
function getLog(messages: ConsoleMessage[]) {
  return Promise.all(messages
    .filter((message) => message.text().startsWith('!!! '))
    .map(async (message) => ({
      name: message.text().split(' ').slice(1, 3).join(' '),
      props: await message.args()[1].jsonValue() as Record<string, number>,
    })));
}

test('TestNoRedundancy: a global change renders each container once, with consistent props', async ({
  page, navigateToTest, consoleMessages,
}) => {
  await navigateToTest('TestNoRedundancy');

  await expect.poll(() => getLog(consoleMessages)).toEqual([
    { name: 'A MAP', props: {} },
    { name: 'A MOUNT', props: {} },
    { name: 'B MAP', props: {} },
    { name: 'B MOUNT', props: { derivedAValue: 1 } },
  ]);
  await expect(page.locator('.TestB > span')).toHaveText('World');

  // The double click sets `aValue` and `bValue` in the global to the same new value
  consoleMessages.splice(0);
  await page.locator('#test-root').dblclick();
  await expect(page.locator('.TestB > span')).toHaveText('Hello');
  await expect.poll(async () => (await getLog(consoleMessages)).length).toBe(5);

  const log = await getLog(consoleMessages);
  const value = log[0].props.aValue;
  expect(value).toBeGreaterThan(0.5);
  // Both containers are mapped after the change; A renders, and its render maps and renders B once, with the new
  // `aValue` prop, so B's own scheduled update is dropped
  expect(log).toEqual([
    { name: 'A MAP', props: { aValue: value } },
    { name: 'B MAP', props: {} },
    { name: 'A MOUNT', props: { aValue: value } },
    { name: 'B MAP', props: { aValue: value } },
    { name: 'B MOUNT', props: { bValue: value, aValue: value, derivedAValue: value + 1 } },
  ]);
  await expect(page.locator('#test-root h1 + div')).toHaveText(`aValue = ${value}`);
  expect(logTexts(consoleMessages, /MOUNT/)).toHaveLength(2);
});
