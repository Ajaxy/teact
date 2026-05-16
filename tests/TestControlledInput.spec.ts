import { test, expect } from './fixtures';

test('TestControlledInput: Controlled input removes vowels on change', async ({ page, navigateToTest }) => {
  await navigateToTest('TestControlledInput');

  const bodyText = await page.locator('body').textContent();
  expect(bodyText).toContain('TestControlledInput');

  const uncontrolledInput = page.locator('input').first();
  expect(await uncontrolledInput.inputValue()).toBe('Uncontrolled');

  const inputValueDisplay = page.locator('div').filter({ hasText: /Input value:Controlled/ });
  expect(await inputValueDisplay.count()).toBeGreaterThan(0);

  const controlledInput = page.locator('input').nth(1);

  await controlledInput.fill('hello');
  await page.waitForTimeout(100);

  let updatedDisplay = page.locator('div').filter({ hasText: /Input value:hll/ });
  expect(await updatedDisplay.count()).toBeGreaterThan(0);

  await controlledInput.fill('beautiful');
  await page.waitForTimeout(100);

  updatedDisplay = page.locator('div').filter({ hasText: /Input value:btfl/ });
  expect(await updatedDisplay.count()).toBeGreaterThan(0);

  await controlledInput.fill('xyz');
  await page.waitForTimeout(100);

  updatedDisplay = page.locator('div').filter({ hasText: /Input value:xyz/ });
  expect(await updatedDisplay.count()).toBeGreaterThan(0);
});

test('TestControlledInput: Checkbox with allowance control', async ({ page, navigateToTest }) => {
  await navigateToTest('TestControlledInput');

  const checkboxValueDisplay = page.locator('div').filter({ hasText: /Checkbox value:true/ });
  expect(await checkboxValueDisplay.count()).toBeGreaterThan(0);

  const isAllowedCheckbox = page.locator('label').filter({ hasText: /Is allowed/ }).locator('input[type="checkbox"]');
  const isCheckedCheckbox = page.locator('label').filter({ hasText: /Is checked/ }).locator('input[type="checkbox"]');

  expect(await isAllowedCheckbox.isChecked()).toBe(true);
  expect(await isCheckedCheckbox.isChecked()).toBe(true);

  await isAllowedCheckbox.click();
  await page.waitForTimeout(100);

  await isCheckedCheckbox.click();
  await page.waitForTimeout(100);

  let stillTrue = page.locator('div').filter({ hasText: /Checkbox value:true/ });
  expect(await stillTrue.count()).toBeGreaterThan(0);

  await isAllowedCheckbox.click();
  await page.waitForTimeout(100);

  await isCheckedCheckbox.click();
  await page.waitForTimeout(100);

  let nowFalse = page.locator('div').filter({ hasText: /Checkbox value:false/ });
  expect(await nowFalse.count()).toBeGreaterThan(0);

  await isCheckedCheckbox.click();
  await page.waitForTimeout(100);

  let backToTrue = page.locator('div').filter({ hasText: /Checkbox value:true/ });
  expect(await backToTrue.count()).toBeGreaterThan(0);
});
