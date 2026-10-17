// Ported from Ajaxy/teact#6 by @muhin-g-s (tests/TestFragment.spec.ts), strengthened: the order of all children and
// the identity of the child that must not be remounted
import {
  areMarked, expect, markNodes, test,
} from './fixtures';

test('TestFragment: the fragment is inserted before Child, which is not remounted', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestFragment');

  const app = page.locator('.App');
  const children = app.locator('> *');
  const child = app.locator('> div');
  await expect(children).toHaveText(['Click to update', /^This number should never change: \S+$/]);
  const childText = (await child.textContent())!;
  await markNodes(child);

  await app.click();
  await expect(children).toHaveText(['Click to update', 'fragment', 'content', childText]);
  expect(await areMarked(child)).toEqual([true]);

  await app.click();
  await expect(children).toHaveText(['Click to update', childText]);
  expect(await areMarked(child)).toEqual([true]);

  await app.click();
  await expect(children).toHaveText(['Click to update', 'fragment', 'content', childText]);
  expect(await areMarked(child)).toEqual([true]);
});
