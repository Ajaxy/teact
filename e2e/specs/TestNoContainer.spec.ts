// Checks ordered lists of all spans, with web-first waits for the 1-second timers, and the identity of the spans that
// must not be remounted
import {
  areMarked, expect, markNodes, test,
} from './fixtures';

const ALL = Array.from({ length: 13 }, (_, i) => String(i + 1));
const without = (removed: string[]) => ALL.filter((n) => !removed.includes(n));

test('TestNoContainer: containerless components keep their order across unmounts and remounts', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestNoContainer');

  const spans = page.locator('#test-root > span');
  await expect(spans).toHaveText(ALL);
  await markNodes(spans);

  // TestA renders `null` for a second
  await spans.filter({ hasText: /^4$/ }).click();
  await expect(spans).toHaveText(without(['4', '5', '6']));
  await expect(spans).toHaveText(ALL, { timeout: 3000 });
  expect(await areMarked(spans)).toEqual(ALL.map((n) => !['4', '5', '6'].includes(n)));

  // TestB hides some of its fragment's children for a second
  await markNodes(spans);
  await spans.filter({ hasText: /^8$/ }).click();
  await expect(spans).toHaveText(without(['7', '9', '10']));
  await expect(spans).toHaveText(ALL, { timeout: 3000 });
  expect(await areMarked(spans)).toEqual(ALL.map((n) => !['7', '9', '10'].includes(n)));

  // A new key remounts TestA in place
  await markNodes(spans);
  await spans.filter({ hasText: /^1$/ }).click();
  await expect.poll(() => areMarked(spans)).toEqual(ALL.map((n) => !['4', '5', '6'].includes(n)));
  await expect(spans).toHaveText(ALL);
});
