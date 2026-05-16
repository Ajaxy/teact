import { ConsoleMessage, Page } from '@playwright/test';
import { test, expect } from './fixtures';

test('TestContext: Context.Provider supplies values to consuming components', async ({ page, navigateToTest }) => {
  const consoleLogs = setupConsoleLogging(page);

  await navigateToTest('TestContext');

  const initialValue = await verifyInitialRender(consoleLogs);

  await verifyInitialDOM(page, initialValue);

  const { updatedValue } = await changeContextValue(page, consoleLogs, initialValue);

  await swapContextWrapper(page, consoleLogs);

  await swapBackToProvider(page, consoleLogs, updatedValue);
});

function setupConsoleLogging(page: Page) {
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });
  return consoleLogs;
}

async function verifyInitialRender(consoleLogs: string[]) {
  const initialLogs = consoleLogs.filter(log => log.startsWith('ContextConsumer'));
  expect(initialLogs.length).toBeGreaterThan(0);

  const aLog = initialLogs.find(log => log.startsWith('ContextConsumer A'));
  const bLog = initialLogs.find(log => log.startsWith('ContextConsumer B'));
  const cLog = initialLogs.find(log => log.startsWith('ContextConsumer C'));

  expect(aLog).toBeDefined();
  expect(bLog).toBeDefined();
  expect(cLog).toBeDefined();

  const aValue = aLog!.replace(/ContextConsumer [A-Z] /, '');
  const bValue = bLog!.replace(/ContextConsumer [A-Z] /, '');
  const cValue = cLog!.replace(/ContextConsumer [A-Z] /, '');

  expect(aValue).toBe(bValue);
  expect(bValue).toBe(cValue);

  return aValue;
}

async function verifyInitialDOM(page: Page, initialValue: string) {
  const consumerDivs = page.locator('div').filter({ hasText: /Current context value:/ });
  const initialDomCount = await consumerDivs.count();
  expect(initialDomCount).toBeGreaterThan(0);

  const initialDomText = await consumerDivs.first().textContent();
  expect(initialDomText).toContain(`Current context value: ${initialValue}`);
}

async function changeContextValue(page: Page, consoleLogs: string[], initialValue: string){
  consoleLogs.length = 0;

  const changeButton = page.locator('button').first();
  await changeButton.click();
  await page.waitForTimeout(100);

  const updatedLogs = consoleLogs.filter(log => log.startsWith('ContextConsumer'));
  expect(updatedLogs.length).toBeGreaterThan(0);

  const updatedALog = updatedLogs.find(log => log.startsWith('ContextConsumer A'));
  const updatedBLog = updatedLogs.find(log => log.startsWith('ContextConsumer B'));
  const updatedCLog = updatedLogs.find(log => log.startsWith('ContextConsumer C'));

  expect(updatedALog).toBeDefined();
  expect(updatedBLog).toBeDefined();
  expect(updatedCLog).toBeDefined();

  const updatedAValue = updatedALog!.replace(/ContextConsumer [A-Z] /, '');
  const updatedBValue = updatedBLog!.replace(/ContextConsumer [A-Z] /, '');
  const updatedCValue = updatedCLog!.replace(/ContextConsumer [A-Z] /, '');

  expect(updatedAValue).not.toBe(initialValue);
  expect(updatedAValue).toBe(updatedBValue);
  expect(updatedBValue).toBe(updatedCValue);

  const consumerDivs = page.locator('div').filter({ hasText: /Current context value:/ });
  const updatedDomText = await consumerDivs.first().textContent();
  expect(updatedDomText).toContain(`Current context value: ${updatedAValue}`);

  return {
    updatedValue: updatedAValue,
  };
}

async function swapContextWrapper(page: Page, consoleLogs: string[]){
  consoleLogs.length = 0;

  const swapButton = page.locator('button').nth(1);
  await swapButton.click();
  await page.waitForTimeout(100);

  const swappedDiv = page.locator('div').filter({ hasText: /Swapped/ });
  expect(await swappedDiv.count()).toBeGreaterThan(0);

  const swappedText = await page.locator('body').textContent();
  expect(swappedText).toContain('Swapped');
  expect(swappedText).toContain('default value');

  const swappedLogs = consoleLogs.filter(log => log.startsWith('ContextConsumer'));
  const swappedALog = swappedLogs.find(log => log.startsWith('ContextConsumer A'));
  expect(swappedALog).toBeDefined();
  expect(swappedALog).toContain('default value');
}

async function swapBackToProvider(page: Page, consoleLogs: string[], updatedValue: string) {
  consoleLogs.length = 0;

  const swapButton = page.locator('button').nth(1);
  await swapButton.click();
  await page.waitForTimeout(100);

  const backToProviderLogs = consoleLogs.filter(log => log.startsWith('ContextConsumer'));
  expect(backToProviderLogs.length).toBeGreaterThan(0);

  const backToProviderALog = backToProviderLogs.find(log => log.startsWith('ContextConsumer A'));
  expect(backToProviderALog).toBeDefined();

  const backToProviderValue = backToProviderALog!.replace(/ContextConsumer [A-Z] /, '');
  expect(backToProviderValue).toBe(updatedValue);

  const backToProviderDivs = page.locator('div').filter({ hasText: /Current context value:/ });
  expect(await backToProviderDivs.count()).toBeGreaterThan(0);

  let foundNumericValue = false;
  for (let i = 0; i < Math.min(3, await backToProviderDivs.count()); i++) {
    const text = await backToProviderDivs.nth(i).textContent();
    if (text?.includes(updatedValue)) {
      foundNumericValue = true;
      break;
    }
  }
  expect(foundNumericValue).toBe(true);
}
