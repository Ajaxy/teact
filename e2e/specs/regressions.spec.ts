// Regression specs from the review of Ajaxy/teact#7 (oss-plan evidence: pr7-regression-specs), rewritten as
// web-first assertions without fixed sleeps or logging
import { expect, test } from './fixtures';

const SVG_NS = 'http://www.w3.org/2000/svg';

test('context consumers keep updating after a sibling consumer unmounts', async ({ page, navigateToTest }) => {
  await navigateToTest('ReviewContextUnmount');

  await expect(page.locator('#a')).toHaveText('a: v0');
  await expect(page.locator('#b')).toHaveText('b: v0');
  await page.locator('#change').click();
  await expect(page.locator('#b')).toHaveText('b: v1');

  await page.locator('#hide-a').click();
  await expect(page.locator('#a')).toHaveCount(0);
  await page.locator('#change').click();
  await expect(page.locator('#b')).toHaveText('b: v2');
});

test('context currently does not reach the content of a Portal, which renders into a separate root', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('ReviewPortalContext');

  // KNOWN ISSUE K4 (pinned in B2; not scheduled, see KNOWN-ISSUES.md): unlike React's `createPortal`, Web A's Portal
  // (and its stand-in here) renders its children into a separate Teact root, outside the provider. React: 'provided'

  await expect(page.locator('#test-root #inline')).toHaveText('inline: provided');
  await expect(page.locator('#portals #portaled')).toHaveText('portaled: default');
});

test('Portal content keeps its state when the component around the Portal re-renders', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('ReviewPortalState');

  await page.locator('#portal-inc').click();
  await expect(page.locator('#portal-inc')).toHaveText('portal: 1');
  await page.locator('#main-inc').click();
  await expect(page.locator('#main-inc')).toHaveText('main: 1');
  await expect(page.locator('#portal-inc')).toHaveText('portal: 1');
  await expect(page.locator('#portals #portal-content')).toHaveCount(1);
});

test('SVG children of a component and of a fragment keep the namespace when the parent updates', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('ReviewSvgParentUpdate');

  const children = page.locator('svg > *');
  await expect(children).toHaveCount(2);
  await page.locator('#toggle-svg').click();
  await expect(children).toHaveCount(4);

  expect(await children.evaluateAll((elements) => elements.map((element) => [
    element.getAttribute('data-testid'), element.namespaceURI, element.getAttribute('fill'),
  ]))).toEqual([
    ['child-circle', SVG_NS, 'black'],
    ['child-rect', SVG_NS, 'red'],
    ['fragment-circle', SVG_NS, 'black'],
    ['fragment-rect', SVG_NS, 'red'],
  ]);
});

test('`className` of an SVG element in a component sets the `class` attribute', async ({ page, navigateToTest }) => {
  await navigateToTest('ReviewSvgClass');

  const rect = page.getByTestId('class-rect');
  await expect(rect).toHaveAttribute('class', 'off');
  await page.locator('#class-toggle').click();
  await expect(page.getByTestId('class-state')).toHaveText('true');
  await expect(rect).toHaveAttribute('class', 'on');
  await page.locator('#class-toggle').click();
  await expect(rect).toHaveAttribute('class', 'off');
});

test('a signal dependency is released when its component unmounts', async ({ page, navigateToTest }) => {
  await navigateToTest('ReviewSignalLeak');

  const consumer = page.locator('#consumer');
  const getCalls = () => page.evaluate(() => window.resolverCalls);
  await expect(consumer).toHaveText('value: 0');
  await expect.poll(getCalls).toBe(1);

  await page.locator('#inc').click();
  await expect(consumer).toHaveText('value: 1');
  await expect.poll(getCalls).toBe(2);

  await page.locator('#toggle-consumer').click();
  await expect(consumer).toHaveCount(0);
  await page.locator('#inc').click();
  await page.locator('#inc').click();

  // A new consumer starts from the current value; the unmounted one never ran again
  await page.locator('#toggle-consumer').click();
  await expect(consumer).toHaveText('value: 3');
  await expect.poll(getCalls).toBe(3);
});
