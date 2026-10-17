// T-errors: the errors that Teact catches go to `configureTeact({ onError })`, or to `console.error` by default.
// Teact adds no global error listeners.
import {
  configureTeact, useEffect, useLayoutEffect, useState,
} from '@teact/core';
import TeactDOM from '@teact/core/dom';
import { requestForcedReflow, requestMeasure, requestMutation } from '@teact/core/fasterdom';
import { requestAfterRender } from '@teact/core/internal';
import {
  addCallback, addUntypedActionHandler, getUntypedActions, getUntypedGlobal, removeCallback, setUntypedGlobal,
  withUntypedGlobal,
} from '@teact/core/teactn';
import {
  afterEach, beforeEach, describe, expect, type Mock, type MockInstance, test, vi,
} from 'vitest';

let root: HTMLDivElement;
let onError: Mock<(error: Error) => void>;
let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.useFakeTimers();

  root = document.createElement('div');
  document.body.appendChild(root);

  onError = vi.fn();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  configureTeact({ onError });
});

afterEach(async () => {
  TeactDOM.render(undefined, root);
  await flushFrames();
  root.remove();

  configureTeact({ onError: undefined });
  consoleError.mockRestore();
  vi.useRealTimers();
});

// Runs Teact's frames: update passes, effects, fasterdom phases and after-render callbacks
async function flushFrames() {
  await vi.runAllTimersAsync();
}

function reportedMessages() {
  return onError.mock.calls.map(([error]) => error.message);
}

describe('`onError` receives the errors that Teact catches', () => {
  test('in a component render; the component keeps what it rendered before', async () => {
    let setValue!: (value: number) => void;

    function Component() {
      const [value, setValueState] = useState(1);
      setValue = setValueState;

      if (value === 2) {
        throw new Error('render');
      }

      return <div>{value}</div>;
    }

    TeactDOM.render(<Component />, root);
    setValue(2);
    await flushFrames();

    expect(reportedMessages()).toEqual(['render']);
    expect(root.textContent).toBe('1');
  });

  test('in effects, layout effects and their cleanups', async () => {
    function Component({ value }: { value: number }) {
      useLayoutEffect(() => {
        if (value === 1) throw new Error('layout effect');
        return () => {
          throw new Error(`layout cleanup ${value}`);
        };
      }, [value]);

      useEffect(() => {
        if (value === 1) throw new Error('effect');
        return () => {
          throw new Error(`effect cleanup ${value}`);
        };
      }, [value]);

      return <div>{value}</div>;
    }

    TeactDOM.render(<Component value={1} />, root);
    expect(reportedMessages()).toEqual(['layout effect']);

    await flushFrames();
    expect(reportedMessages()).toEqual(['layout effect', 'effect']);

    TeactDOM.render(<Component value={2} />, root);
    await flushFrames();
    TeactDOM.render(<Component value={3} />, root);
    await flushFrames();
    TeactDOM.render(undefined, root);

    expect(reportedMessages()).toEqual([
      'layout effect',
      'effect',
      // The cleanups of the effects that value 2 set up, when value 3 replaces them
      'layout cleanup 2',
      'effect cleanup 2',
      // Unmounting runs the remaining cleanups
      'layout cleanup 3',
      'effect cleanup 3',
    ]);
  });

  test('in fasterdom tasks and forced reflows', async () => {
    requestMeasure(() => {
      throw new Error('measure');
    });
    requestMutation(() => {
      throw new Error('mutation');
    });
    requestForcedReflow(() => {
      throw new Error('forced reflow');
    });
    requestForcedReflow(() => () => {
      throw new Error('forced reflow mutation');
    });
    await flushFrames();

    expect(reportedMessages()).toEqual(['measure', 'mutation', 'forced reflow', 'forced reflow mutation']);
  });

  test('in after-render callbacks, which do not stop the callbacks after them', async () => {
    const after = vi.fn();
    requestAfterRender(() => {
      throw new Error('after render');
    });
    requestAfterRender(after);
    await flushFrames();

    expect(reportedMessages()).toEqual(['after render']);
    expect(after).toHaveBeenCalledTimes(1);
  });

  test('in TeactN mappers, when a container mounts and when the global changes', async () => {
    const Container = withUntypedGlobal((global) => {
      if (global.shouldThrow) {
        throw new Error(`mapper ${global.shouldThrow}`);
      }

      return {};
    })(() => <div />);

    setUntypedGlobal({ ...getUntypedGlobal(), shouldThrow: 'on mount' });
    TeactDOM.render(<Container />, root);
    setUntypedGlobal({ ...getUntypedGlobal(), shouldThrow: 'on update' });
    await flushFrames();
    setUntypedGlobal({ ...getUntypedGlobal(), shouldThrow: undefined });

    expect(reportedMessages()).toEqual(['mapper on mount', 'mapper on update']);
  });
});

describe('Reported values', () => {
  test('errors are reported as they were thrown', async () => {
    const error = new TypeError('original');
    requestMeasure(() => {
      throw error;
    });
    await flushFrames();

    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  });

  test('values that are not errors are wrapped, with the value as `cause`', async () => {
    const thrownObject = { code: 42 };
    // eslint-disable-next-line no-null/no-null
    const nullPrototype = Object.create(null) as object;
    requestMeasure(() => {
      throw 'a string'; // eslint-disable-line @typescript-eslint/only-throw-error
    });
    requestMeasure(() => {
      throw thrownObject; // eslint-disable-line @typescript-eslint/only-throw-error
    });
    requestMeasure(() => {
      throw nullPrototype; // eslint-disable-line @typescript-eslint/only-throw-error
    });
    await flushFrames();

    const errors = onError.mock.calls.map(([error]) => error);
    expect(errors.every((error) => error instanceof Error)).toBe(true);
    expect(errors.map(({ message, cause }) => ({ message, cause }))).toEqual([
      { message: 'a string', cause: 'a string' },
      { message: '[object Object]', cause: thrownObject },
      { message: 'Non-error value thrown', cause: nullPrototype },
    ]);
  });
});

describe('configureTeact', () => {
  test('without `onError`, errors go to `console.error`', async () => {
    configureTeact({ onError: undefined });
    const error = new Error('default');
    requestMeasure(() => {
      throw error;
    });
    await flushFrames();

    expect(onError).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(error);
  });

  test('options left out keep their values', async () => {
    configureTeact({});
    requestMeasure(() => {
      throw new Error('kept');
    });
    await flushFrames();

    expect(reportedMessages()).toEqual(['kept']);
  });

  test('accepts handlers declared with narrower or wider parameter types', () => {
    const webAHandler = (err: Error) => void err;
    const mtwHandler = (err: Error | string) => void err;

    configureTeact({ onError: webAHandler });
    configureTeact({ onError: mtwHandler });
    configureTeact({ onError: console.error }); // eslint-disable-line no-console
    configureTeact({ onError });
  });

  test('a handler that throws is logged with the error, and Teact keeps working', async () => {
    const handlerError = new Error('handler');
    const error = new Error('task');
    const nextTask = vi.fn();
    configureTeact({
      onError: () => {
        throw handlerError;
      },
    });
    requestMeasure(() => {
      throw error;
    });
    requestMeasure(nextTask);
    await flushFrames();

    expect(consoleError).toHaveBeenCalledExactlyOnceWith(handlerError, error);
    expect(nextTask).toHaveBeenCalledTimes(1);
  });
});

describe('Errors that Teact does not catch', () => {
  test('a TeactN action handler error reaches the caller, not `onError`', () => {
    addUntypedActionHandler('throwInHandler', () => {
      throw new Error('action');
    });

    expect(() => getUntypedActions().throwInHandler()).toThrow('action');
    expect(onError).not.toHaveBeenCalled();
  });

  test('a TeactN `addCallback` callback error reaches the caller, not `onError`', () => {
    const callback = () => {
      throw new Error('callback');
    };
    addCallback(callback);

    try {
      // `forceSyncOnIOs` runs the callbacks inside `setGlobal`. Otherwise they run at the end of the tick, where the
      // error becomes an unhandled rejection, as in Web A.
      expect(() => setUntypedGlobal({ ...getUntypedGlobal(), callbackTest: true }, { forceSyncOnIOs: true }))
        .toThrow('callback');
    } finally {
      removeCallback(callback);
    }

    expect(onError).not.toHaveBeenCalled();
  });

  test('no global error listeners are added on import or when an error is reported', async () => {
    const windowListener = vi.spyOn(window, 'addEventListener');
    const documentListener = vi.spyOn(document, 'addEventListener');

    vi.resetModules();
    const [core, , fasterdom] = await Promise.all([
      import('@teact/core'),
      import('@teact/core/dom'),
      import('@teact/core/fasterdom'),
      import('@teact/core/teactn'),
      import('@teact/core/internal'),
    ]);
    core.configureTeact({ onError });
    fasterdom.requestMeasure(() => {
      throw new Error('fresh copy');
    });
    await flushFrames();

    const types = [...windowListener.mock.calls, ...documentListener.mock.calls].map(([type]) => type);
    expect(types).not.toContain('error');
    expect(types).not.toContain('unhandledrejection');
    expect(reportedMessages()).toEqual(['fresh copy']);
  });
});
