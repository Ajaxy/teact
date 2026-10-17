// Web A's testTick.tsx: a module that re-renders a new element tree into `#root` every second
import {
  areMarked, expect, markNodes, test,
} from './fixtures';

test('testTick: repeated `render()` calls update the same DOM nodes', async ({ page, navigateToTest }) => {
  await navigateToTest('testTick');

  const root = page.locator('#root');
  await expect(root.locator('> div > *')).toHaveText(['Hello, world!', /^It is.+\.$/], { timeout: 3000 });
  const time = await root.locator('h2').textContent();
  await markNodes(root.locator('div, h1, h2'));

  await expect(root.locator('h2')).not.toHaveText(time!, { timeout: 3000 });
  await expect(root.locator('> div > *')).toHaveText(['Hello, world!', /^It is.+\.$/]);
  expect(await areMarked(root.locator('div, h1, h2'))).toEqual([true, true, true]);
});
