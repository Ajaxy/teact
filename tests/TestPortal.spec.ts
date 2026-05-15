import { test, expect } from './fixtures';

test('TestPortal: Portal renders children in alternate DOM container', async ({ page, navigateToTest }) => {
  await navigateToTest('TestPortal');

  const bodyText = await page.locator('body').textContent();

  expect(bodyText).toContain('TestPortal');

  const portalContainer = page.locator('#portals');
  expect(await portalContainer.count()).toBe(1);

  const rootDiv = page.locator('#root');
  const rootDivText = await rootDiv.textContent();

  const testNormalHeading = page.locator('#root h2').filter({ hasText: /Test normal/ });
  expect(await testNormalHeading.count()).toBeGreaterThanOrEqual(1);

  const testPortalHeading = page.locator('#portals h2').filter({ hasText: /Test portal/ });
  expect(await testPortalHeading.count()).toBe(1);

  const stateElements = page.locator('div').filter({ hasText: /state value:/ });
  expect(await stateElements.count()).toBeGreaterThanOrEqual(2);

  const buttons = page.locator('input[type="button"]');
  const buttonCount = await buttons.count();
  expect(buttonCount).toBeGreaterThanOrEqual(2);

  await buttons.first().click();
  await page.waitForTimeout(100);

  const mainStateDiv = page.locator('#root div').filter({ hasText: /state value: 1/ });
  expect(await mainStateDiv.count()).toBeGreaterThanOrEqual(1);

  const portalStateDiv = page.locator('#portals div').filter({ hasText: /state value: 0/ });
  expect(await portalStateDiv.count()).toBeGreaterThanOrEqual(1);
});
