// Checks the exact text nodes in order
import { expect, test } from './fixtures';

test('TestSetContent: text before a text-only component is kept and can be removed', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestSetContent');

  const box = page.locator('#test-root > div');
  const textNodes = () => box.evaluate((element) => Array.from(element.childNodes, (node) => node.textContent));
  await expect(box).toHaveText('First linetext componentLast line');
  expect(await textNodes()).toEqual(['First line', 'text component', 'Last line']);

  await box.click();
  await expect(box).toHaveText('text componentLast line');
  // The removed text leaves an empty placeholder text node
  expect(await textNodes()).toEqual(['', 'text component', 'Last line']);

  await box.click();
  await expect(box).toHaveText('First linetext componentLast line');
  expect(await textNodes()).toEqual(['First line', 'text component', 'Last line']);
});
