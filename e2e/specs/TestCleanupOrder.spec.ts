// Ported from Ajaxy/teact#7 by @muhin-g-s (tests/TestCleanupOrder.spec.ts), strengthened: the exact order of every
// effect and cleanup on mount, unmount and remount, waited for instead of a fixed sleep
import { expect, logTexts, test } from './fixtures';

const EFFECT_LOG = /^(Layout|Effect|Cleanup) /;

// Component ids grow in mount order (Component1, Component2, Component3, Component1B); effects run by descending id,
// then in declaration order within a component
const MOUNT = [
  'Layout 1b', 'Layout 3', 'Layout 2', 'Layout 1', 'Layout 1.2',
  'Effect 1b', 'Effect 3', 'Effect 2', 'Effect 1', 'Effect 1.2',
];

// Unmounting runs the cleanups parent first, in declaration order within a component
const UNMOUNT = [
  'Cleanup 1', 'Cleanup 1.2', 'Layout Cleanup 1', 'Layout Cleanup 1.2',
  'Cleanup 2', 'Layout Cleanup 2',
  'Cleanup 3', 'Layout Cleanup 3',
  'Cleanup 1b', 'Layout Cleanup 1b',
];

test('TestCleanupOrder: effects run child first; cleanups on unmount run parent first', async ({
  page, navigateToTest, consoleMessages,
}) => {
  await navigateToTest('TestCleanupOrder');
  await expect.poll(() => logTexts(consoleMessages, EFFECT_LOG)).toEqual(MOUNT);

  const box = page.locator('#test-root > div');
  await box.click();
  await expect(box).toHaveText('');
  await expect.poll(() => logTexts(consoleMessages, EFFECT_LOG)).toEqual([...MOUNT, ...UNMOUNT]);

  await box.click();
  await expect(box).toHaveText('LeafB');
  await expect.poll(() => logTexts(consoleMessages, EFFECT_LOG)).toEqual([...MOUNT, ...UNMOUNT, ...MOUNT]);
});
