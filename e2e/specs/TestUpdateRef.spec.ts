// Ported from Ajaxy/teact#6 by @muhin-g-s (tests/TestUpdateRef.spec.ts), strengthened per the oss-plan evidence: it
// runs on Web A's original TestUpdateRef (verbatim), reads the refs from the elements its effect logs, and checks that
// the reused input keeps its DOM node and value
import { type ConsoleMessage, expect, type Page, test } from './fixtures';

// TestUpdateRef logs `'!!!', inputRef.current` and then `'!!!', headingRef.current` whenever `isShown` changes
async function getLoggedRefs(messages: ConsoleMessage[]) {
  const refMessages = messages.filter((message) => message.text().startsWith('!!!'));

  return Promise.all(refMessages.map((message) => message.args()[1].evaluate(
    (element: Element | undefined) => element?.tagName ?? 'none',
  )));
}

function getBoxes(page: Page) {
  return page.locator('#test-root > div');
}

test('TestUpdateRef: a reused node clears the ref it no longer has; a new node gets the ref', async ({
  page, navigateToTest, consoleMessages,
}) => {
  await navigateToTest('TestUpdateRef');

  const input = getBoxes(page).nth(0).locator('input');
  await input.fill('keep me');
  await expect.poll(() => getLoggedRefs(consoleMessages)).toEqual(['INPUT', 'H1']);
  await input.evaluate((element) => {
    (element as HTMLInputElement & { e2eMark?: boolean }).e2eMark = true;
  });

  await getBoxes(page).nth(1).click();
  await expect(getBoxes(page).nth(1).locator('> *')).toHaveText(['Hidden']);
  await expect(getBoxes(page).nth(1).locator('h2')).toHaveCount(1);
  await expect.poll(() => getLoggedRefs(consoleMessages)).toEqual(['INPUT', 'H1', 'none', 'H2']);
  await expect(input).toHaveValue('keep me');
  expect(await input.evaluate((element) => (element as HTMLInputElement & { e2eMark?: boolean }).e2eMark)).toBe(true);

  await getBoxes(page).nth(0).click();
  await expect(getBoxes(page).nth(1).locator('h1')).toHaveText('Shown');
  await expect.poll(() => getLoggedRefs(consoleMessages)).toEqual(['INPUT', 'H1', 'none', 'H2', 'INPUT', 'H1']);
  await expect(input).toHaveValue('keep me');
});
