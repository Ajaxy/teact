// Ported from Ajaxy/teact#7 by @muhin-g-s (tests/TestPortal.spec.ts), strengthened: the portal content is in
// `#portals` and not in the test root, each side keeps its own state, and the portal content is not remounted when
// the component around it re-renders
import {
  areMarked, expect, markNodes, test,
} from './fixtures';

test('TestPortal: children render into `#portals` and keep their state across parent renders', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestPortal');

  const root = page.locator('#test-root');
  const portals = page.locator('#portals');
  await expect(root.locator('h2')).toHaveText(['Test normal']);
  await expect(portals.locator('h2')).toHaveText(['Test portal']);
  await expect(root.getByText('state value:')).toHaveText(/^state value: 0!/);
  await expect(portals.getByText('state value:')).toHaveText(/^state value: 0!/);
  await markNodes(portals.locator('h2'));

  await portals.locator('input[type="button"]').click();
  await expect(portals.getByText('state value:')).toHaveText(/^state value: 1!/);
  await expect(root.getByText('state value:')).toHaveText(/^state value: 0!/);

  // TestPortal re-renders (with a new random position for the portal content)
  // The handlers read the rendered value, so each click waits for the previous render
  await root.locator('input[type="button"]').click();
  await expect(root.getByText('state value:')).toHaveText(/^state value: 1!/);
  await root.locator('input[type="button"]').click();
  await expect(root.getByText('state value:')).toHaveText(/^state value: 2!/);
  await expect(portals.getByText('state value:')).toHaveText(/^state value: 1!/);
  expect(await areMarked(portals.locator('h2'))).toEqual([true]);
});
