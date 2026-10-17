/**
 * Frame control for Teact tests.
 *
 * Teact batches its work into frames. State updates, effects, after-render callbacks and fasterdom tasks run in a
 * pass that `fastRaf` schedules with `requestAnimationFrame` (with a 35 ms timeout fallback), and the pass chains its
 * measure, mutate and forced-reflow phases with promises. Passive effects scheduled by a pass run in the next one.
 *
 * `installFrameQueue()` queues `requestAnimationFrame` callbacks instead of handing them to the browser:
 * - `runFrame()` runs the frame that is queued now and lets its promise chains settle;
 * - `flushFrames()` keeps running frames until none is scheduled, so every pending update, effect and after-render
 *   callback has run when it resolves.
 * Frames therefore advance only when a test runs them, as long as each step takes less than `fastRaf`'s 35 ms
 * fallback. Assertions about the state before a pass belong right after the action that schedules it (for example
 * right after `dispatchEvent`), with no slow `await` in between. A watchdog still runs frames that nobody flushes
 * within `WATCHDOG_MS`, so code that waits for a real frame does not hang.
 */

const WATCHDOG_MS = 250;

let queue: { id: number; callback: FrameRequestCallback }[] = [];
let lastId = 0;
let watchdogTimeout: number | undefined;
let uninstallQueue: (() => void) | undefined;

export function installFrameQueue() {
  if (uninstallQueue) return uninstallQueue;

  const nativeRequest = window.requestAnimationFrame;
  const nativeCancel = window.cancelAnimationFrame;

  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    const id = ++lastId;
    queue.push({ id, callback });

    watchdogTimeout ??= window.setTimeout(() => {
      watchdogTimeout = undefined;
      runQueuedCallbacks(performance.now());
    }, WATCHDOG_MS);

    return id;
  };

  window.cancelAnimationFrame = (id: number) => {
    queue = queue.filter((frame) => frame.id !== id);
  };

  uninstallQueue = () => {
    window.requestAnimationFrame = nativeRequest;
    window.cancelAnimationFrame = nativeCancel;
    clearWatchdog();

    // Hand the callbacks that are still queued back to the browser, so that no scheduled work is lost
    const pending = queue;
    queue = [];
    pending.forEach(({ callback }) => nativeRequest.call(window, callback));

    uninstallQueue = undefined;
  };

  return uninstallQueue;
}

export function hasQueuedFrame() {
  return queue.length > 0;
}

/** Runs the frame queued now (if any) and waits for its promise chains; returns whether there was one */
export async function runFrame() {
  await settle();
  if (!queue.length) return false;

  runQueuedCallbacks(performance.now());
  await settle();

  return true;
}

/** Runs frames until no more are scheduled */
export async function flushFrames(maxFrames = 50) {
  for (let i = 0; i < maxFrames; i++) {
    if (!await runFrame()) return;
  }

  throw new Error(`flushFrames(): frames are still being scheduled after ${maxFrames} of them`);
}

function runQueuedCallbacks(time: number) {
  clearWatchdog();

  const callbacks = queue;
  queue = [];
  callbacks.forEach(({ callback }) => callback(time));
}

function clearWatchdog() {
  if (watchdogTimeout !== undefined) {
    clearTimeout(watchdogTimeout);
    watchdogTimeout = undefined;
  }
}

// A macrotask boundary: all microtasks (fasterdom phases, `onTickEnd`, mutation observers) have run by then
function settle() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}
