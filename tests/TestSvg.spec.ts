import { test, expect } from './fixtures';

test('TestSvg: SVG elements maintain namespace after component re-render', async ({ page, navigateToTest }) => {
  await navigateToTest('TestSvg');

  const svg = page.locator('svg');
  expect(await svg.count()).toBe(1);

  const circles = page.locator('svg circle');
  expect(await circles.count()).toBeGreaterThanOrEqual(2);

  const gradients = page.locator('svg linearGradient');
  expect(await gradients.count()).toBe(1);

  const rects = page.locator('svg rect');
  expect(await rects.count()).toBe(2);

  const mainCircle = page.locator('svg circle.shared-canvas-container');

  let initialDashOffset = await mainCircle.getAttribute('stroke-dashoffset');
  expect(initialDashOffset).toBe('0');

  const nestedCircle = page.locator('[data-testid="nested-circle"]');
  let initialFill = await nestedCircle.getAttribute('fill');
  expect(initialFill).toBe('blue');

  await page.locator('.App').click();
  await page.waitForTimeout(100);

  expect(await svg.count()).toBe(1);
  expect(await circles.count()).toBeGreaterThanOrEqual(2);
  expect(await gradients.count()).toBe(1);
  expect(await rects.count()).toBe(2);

  let newDashOffset = await mainCircle.getAttribute('stroke-dashoffset');
  expect(newDashOffset).toBe('140');

  await page.locator('.App').click();
  await page.waitForTimeout(100);

  newDashOffset = await mainCircle.getAttribute('stroke-dashoffset');
  expect(newDashOffset).toBe('0');

  expect(await svg.count()).toBe(1);
  expect(await circles.count()).toBeGreaterThanOrEqual(2);
  expect(await gradients.count()).toBe(1);
  expect(await rects.count()).toBe(2);
});
