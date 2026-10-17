// Checks ordered child lists and the identity of the last element
import {
  areMarked, expect, markNodes, test,
} from './fixtures';

const LAST = 'This should always go last.';

test('TestFragment2: fragment items come back before the element that goes last', async ({ page, navigateToTest }) => {
  await navigateToTest('TestFragment2');

  const app = page.locator('.App');
  const children = app.locator('> *');
  await expect(children).toHaveText(['Click to update', '1', '2', '3', LAST]);
  await markNodes(children);

  await app.click();
  await expect(children).toHaveText(['Click to update', LAST]);
  expect(await areMarked(children)).toEqual([true, true]);

  await app.click();
  await expect(children).toHaveText(['Click to update', '1', '2', '3', LAST]);
  expect(await areMarked(children)).toEqual([true, false, false, false, true]);
});
