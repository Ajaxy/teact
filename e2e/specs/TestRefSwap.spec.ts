// Ported from Ajaxy/teact#6 by @muhin-g-s (tests/TestUpdateRef.spec.ts, for his TestUpdateRef, here TestRefSwap),
// strengthened: exact texts instead of searching the page HTML, the identity of the swapped span, and the ref
import {
  areMarked, expect, logTexts, markNodes, test,
} from './fixtures';

test('TestRefSwap: a span swapped for one of the same tag keeps its node and the ref', async ({
  page, navigateToTest, consoleMessages,
}) => {
  await navigateToTest('TestRefSwap');

  const span = page.locator('#test-root span');
  const current = page.locator('#test-root > div').nth(1);
  await expect(span).toHaveText('First');
  await expect(current).toHaveText('Current: First');
  await expect.poll(() => logTexts(consoleMessages, /^ref /)).toEqual(['ref First']);
  await markNodes(span);

  await span.click();
  await expect(span).toHaveText('Second');
  await expect(current).toHaveText('Current: Second');
  await expect.poll(() => logTexts(consoleMessages, /^ref /)).toEqual(['ref First', 'ref Second']);
  expect(await areMarked(span)).toEqual([true]);

  await span.click();
  await expect(span).toHaveText('First');
  await expect(current).toHaveText('Current: First');
  await expect.poll(() => logTexts(consoleMessages, /^ref /)).toEqual(['ref First', 'ref Second', 'ref First']);
  expect(await areMarked(span)).toEqual([true]);
});
