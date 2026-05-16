import { test, expect } from './fixtures';

test('TestCleanupOrder: effects and cleanup run in correct order', async ({ page, navigateToTest }) => {
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  await navigateToTest('TestCleanupOrder');

  await page.waitForTimeout(100);

  const effectLogs = consoleLogs.filter(log => {
    return log.includes('Layout') || log.includes('Effect');
  });

  const expectedOrder = [
    'Layout 1b',
    'Layout 3',
    'Layout 2',
    'Layout 1',
    'Layout 1.2',
    'Effect 1b',
    'Effect 3',
    'Effect 2',
    'Effect 1',
    'Effect 1.2',
  ];

  expect(effectLogs.length).toBe(expectedOrder.length);

  for (let i = 0; i < expectedOrder.length; i++) {
    expect(effectLogs[i]).toContain(expectedOrder[i]);
  }
});
