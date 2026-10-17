// fasterdom: the order of measure, mutate and forced-reflow phases within a frame
import {
  getPhase, requestForcedReflow, requestMeasure, requestMutation, requestNextMutation,
} from '@teact/core/fasterdom';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

let log: string[];

beforeEach(() => {
  vi.useFakeTimers();
  log = [];
});

afterEach(async () => {
  // Run the frames that are still scheduled, so the next test starts with idle schedulers
  await vi.runAllTimersAsync();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function record(name: string) {
  return () => {
    log.push(`${name}:${getPhase()}`);
  };
}

// The pass runs in a frame and chains its phases with promises
async function runFrame() {
  vi.advanceTimersToNextFrame();
  await vi.advanceTimersByTimeAsync(0);
}

describe('fasterdom phases', () => {
  test('a frame runs measure tasks, then mutation tasks, then forced reflows and their mutations', async () => {
    requestForcedReflow(() => {
      record('reflow')();
      return record('reflow-mutation');
    });
    requestMutation(record('mutation-1'));
    requestMeasure(record('measure-1'));
    requestMutation(record('mutation-2'));
    requestMeasure(record('measure-2'));
    expect(log).toEqual([]);

    await runFrame();
    expect(log).toEqual([
      'measure-1:measure',
      'measure-2:measure',
      'mutation-1:mutate',
      'mutation-2:mutate',
      'reflow:measure',
      'reflow-mutation:mutate',
    ]);
    expect(getPhase()).toBe('measure');
  });

  test('a mutation requested while measuring runs in the same frame; later requests go to the next one', async () => {
    requestMeasure(() => {
      record('measure')();
      requestMutation(record('mutation-from-measure'));
      requestMeasure(record('measure-from-measure'));
    });
    requestMutation(() => {
      record('mutation')();
      requestMutation(record('mutation-from-mutation'));
      requestNextMutation(record('next-mutation-from-mutation'));
    });

    await runFrame();
    expect(log).toEqual([
      'measure:measure',
      'mutation:mutate',
      'mutation-from-measure:mutate',
    ]);

    log = [];
    await runFrame();
    expect(log).toEqual([
      'measure-from-measure:measure',
      'mutation-from-mutation:mutate',
      'next-mutation-from-mutation:mutate',
    ]);
  });

  test('`requestNextMutation` runs its task in the mutation phase', async () => {
    requestNextMutation(record('next-mutation'));
    requestMutation(record('mutation'));

    await runFrame();
    expect(log).toEqual(['mutation:mutate', 'next-mutation:mutate']);
  });

  test('forced reflows requested during the reflow loop run in the same loop', async () => {
    requestForcedReflow(() => {
      record('reflow-1')();
      requestForcedReflow(record('reflow-2'));
      return record('reflow-mutation-1');
    });

    await runFrame();
    expect(log).toEqual(['reflow-1:measure', 'reflow-2:measure', 'reflow-mutation-1:mutate']);
  });

  test('an error in a task is reported and does not stop the other tasks', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('Task error');

    requestMeasure(() => {
      throw error;
    });
    requestMeasure(record('measure'));
    requestMutation(() => {
      throw error;
    });
    requestMutation(record('mutation'));

    await runFrame();
    expect(log).toEqual(['measure:measure', 'mutation:mutate']);
    expect(consoleError.mock.calls).toEqual([[error], [error]]);
  });

  test('without a frame, the pass runs after the 35 ms fallback timeout', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    requestMeasure(record('measure'));
    requestMutation(record('mutation'));

    await vi.advanceTimersByTimeAsync(34);
    expect(log).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(log).toEqual(['measure:measure', 'mutation:mutate']);

    // The late frame finds nothing left to run
    frames.forEach((frame) => frame(performance.now()));
    await vi.advanceTimersByTimeAsync(0);
    expect(log).toEqual(['measure:measure', 'mutation:mutate']);
    vi.unstubAllGlobals();
  });
});
