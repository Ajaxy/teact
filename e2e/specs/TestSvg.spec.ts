// Checks the namespace of every SVG element after parent updates and the nested component's own updates, exact
// element counts, `className` as the `class` attribute, and the identity of the updated circle
import type { Page } from '@playwright/test';

import {
  areMarked, expect, markNodes, test,
} from './fixtures';

const SVG_NS = 'http://www.w3.org/2000/svg';

function getNamespaces(page: Page) {
  return page.locator('svg, svg *').evaluateAll((elements) => (
    [...new Set(elements.map((element) => element.namespaceURI))]
  ));
}

test('TestSvg: parent updates keep the SVG namespace and update attributes in place', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestSvg');

  const app = page.locator('.App');
  const circles = page.locator('svg > circle');
  const mainCircle = page.locator('svg > circle.shared-canvas-container');
  const rects = page.locator('svg > rect');
  await expect(page.locator('svg')).toHaveCount(1);
  await expect(circles).toHaveCount(2);
  await expect(page.locator('svg linearGradient > stop')).toHaveCount(2);
  await expect(mainCircle).toHaveAttribute('class', 'shared-canvas-container');
  await expect(mainCircle).toHaveAttribute('stroke-dashoffset', '0');
  await expect(rects.nth(1)).toHaveAttribute('fill', 'green');
  await markNodes(mainCircle);

  await app.click();
  await expect(circles).toHaveCount(3);
  await expect(mainCircle).toHaveAttribute('stroke-dashoffset', '140');
  await expect(mainCircle).toHaveAttribute('stroke-dasharray', '85 160');
  await expect(rects).toHaveCount(2);
  await expect(rects.nth(1)).toHaveAttribute('fill', 'red');
  expect(await getNamespaces(page)).toEqual([SVG_NS]);
  expect(await areMarked(mainCircle)).toEqual([true]);

  await app.click();
  await expect(circles).toHaveCount(2);
  await expect(mainCircle).toHaveAttribute('stroke-dashoffset', '0');
  await expect(rects.nth(1)).toHaveAttribute('fill', 'green');
  expect(await getNamespaces(page)).toEqual([SVG_NS]);
  expect(await areMarked(mainCircle)).toEqual([true]);
});

test('TestSvg: a component inside <svg> keeps the namespace when it updates itself', async ({
  page, navigateToTest,
}) => {
  await navigateToTest('TestSvg');

  // NestedSvg toggles its own state every second (and once right after mounting)
  const nestedCircle = page.locator('svg > circle[r="10"]');
  await expect(nestedCircle).toHaveAttribute('fill', 'red');
  await markNodes(nestedCircle);
  await expect(nestedCircle).toHaveAttribute('fill', 'blue', { timeout: 3000 });
  await expect(nestedCircle).toHaveAttribute('fill', 'red', { timeout: 3000 });

  expect(await nestedCircle.evaluate((element) => element.namespaceURI)).toBe(SVG_NS);
  expect(await areMarked(nestedCircle)).toEqual([true]);
  expect(await getNamespaces(page)).toEqual([SVG_NS]);
});
