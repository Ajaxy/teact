// Checks the list order and the identity of the list items that a changed `teactOrderKey` moves
import { expect, type Page, test } from './fixtures';

function getItems(page: Page) {
  return page.locator('ul > li');
}

function getValues(page: Page) {
  return getItems(page).locator('input[type="text"]').evaluateAll((inputs) => (
    inputs.map((input) => Number((input as HTMLInputElement).value))
  ));
}

// Each item renders a random id that stays with its DOM node
function getIds(page: Page) {
  return getItems(page).evaluateAll((items) => items.map((item) => item.lastChild!.textContent));
}

test('TestOrdered: new items are inserted in order', async ({ page, navigateToTest }) => {
  await navigateToTest('TestOrdered');
  const newValue = page.locator('#mainContainer p input[type="text"]');

  await expect.poll(() => getValues(page)).toEqual([1, 5, 10]);

  await newValue.fill('7');
  await page.locator('input[value="Insert Ordered"]').click();
  await expect.poll(() => getValues(page)).toEqual([1, 5, 7, 10]);

  await newValue.fill('3');
  await page.locator('input[value="Insert Ordered"]').click();
  await expect.poll(() => getValues(page)).toEqual([1, 3, 5, 7, 10]);

  await page.locator('input[value="Add Bigs"]').click();
  await expect.poll(() => getValues(page)).toEqual([1, 3, 5, 7, 10, 105, 110, 120]);

  await page.locator('input[value="Add Smalls"]').click();
  await expect.poll(() => getValues(page)).toEqual([-20, -10, -5, 1, 3, 5, 7, 10, 105, 110, 120]);
});

test('TestOrdered: a changed `teactOrderKey` moves the existing item', async ({ page, navigateToTest }) => {
  await navigateToTest('TestOrdered');

  await expect.poll(() => getValues(page)).toEqual([1, 5, 10]);
  const [id1, id5, id10] = await getIds(page);

  await getItems(page).nth(0).locator('input[type="text"]').fill('7');
  await expect.poll(() => getValues(page)).toEqual([5, 7, 10]);
  expect(await getIds(page)).toEqual([id5, id1, id10]);

  await getItems(page).nth(2).locator('input[type="text"]').fill('2');
  await expect.poll(() => getValues(page)).toEqual([2, 5, 7]);
  expect(await getIds(page)).toEqual([id10, id5, id1]);
});

test('TestOrdered: deleting an item removes only its node', async ({ page, navigateToTest }) => {
  await navigateToTest('TestOrdered');

  await expect.poll(() => getValues(page)).toEqual([1, 5, 10]);
  const [id1, , id10] = await getIds(page);

  await getItems(page).nth(1).locator('input[type="button"]').click();
  await expect.poll(() => getValues(page)).toEqual([1, 10]);
  expect(await getIds(page)).toEqual([id1, id10]);
});

test('TestOrdered: reversing the sort without changing any `teactOrderKey` currently leaves the DOM order', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestOrdered');

  await expect.poll(() => getValues(page)).toEqual([1, 5, 10]);
  const ids = await getIds(page);

  // KNOWN ISSUE H33 (pinned in B2; fix in 0.2, see KNOWN-ISSUES.md): fast-list order drift. Preserved items move only
  // when their order key changes. Expected: [10, 5, 1]
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect.poll(() => getValues(page)).toEqual([1, 5, 10]);
  expect(await getIds(page)).toEqual(ids);
});
