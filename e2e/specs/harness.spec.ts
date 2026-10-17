import { expect, test } from './fixtures';

const WEB_A_COMPONENTS = [
  'ErrorTest', 'SubTest', 'Test', 'TestCleanupOrder', 'TestContext', 'TestControlledInput', 'TestFragment',
  'TestFragment2', 'TestJsxVariableReuse', 'TestNoContainer', 'TestNoRedundancy', 'TestOrdered', 'TestPortal',
  'TestSetContent', 'TestSvg', 'TestUpdateRef', 'testTick',
];

test('the index lists every fixture and links to it', async ({ page }) => {
  await page.goto('./');

  const links = page.locator('#test-root a');
  await expect(links.first()).toBeVisible();
  const names = await links.allTextContents();
  expect(names).toEqual(expect.arrayContaining(WEB_A_COMPONENTS));
  expect(names).toEqual([...names].sort());

  await links.filter({ hasText: /^TestFragment$/ }).click();
  await expect(page).toHaveURL(/\?test=TestFragment$/);
  await expect(page.locator('#test-root .App h2')).toHaveText('Click to update');
});

test('an unknown test name is reported in the page', async ({ page }) => {
  await page.goto('?test=Missing');

  await expect(page.locator('#test-root')).toHaveText('Unknown test: Missing');
});
