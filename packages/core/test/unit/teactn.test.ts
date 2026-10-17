// Ported from Telegram Web A's tests/teactn.test.ts (telegram-tt@f67a40879).
// Changes: imports from `@teact/core/teactn`; a local stand-in for the app's `ActionReturnType`; the disable comment
// for Web A's `tt-multitab` ESLint rule is dropped. Relies on the dev build: the outdated-global check is DEBUG-only.
import {
  addUntypedActionHandler, getUntypedActions,
  getUntypedGlobal, setUntypedGlobal,
} from '@teact/core/teactn';
import { describe, expect, test } from 'vitest';

// Stand-in for Web A's `ActionReturnType` (src/global/types)
type ActionReturnType = AnyLiteral | void | Promise<void>;

describe('Prevent async managing of global', () => {
  test('Work when setting synchronously', () => {
    initGlobal();

    const global = getUntypedGlobal();

    expect(() => {
      setUntypedGlobal({ ...global });
    }).not.toThrow();
  });

  test('Assert when setting asynchronously', async () => {
    initGlobal();

    const global = getUntypedGlobal();

    await Promise.resolve();

    expect(() => {
      setUntypedGlobal({ ...global });
    }).toThrow('[TeactN.setGlobal] Attempt to set an outdated global');
  });

  test('Assert when setting after setting before', () => {
    initGlobal();

    const global = getUntypedGlobal();
    setUntypedGlobal({ ...global });

    expect(() => {
      setUntypedGlobal({ ...global });
    }).toThrow('[TeactN.setGlobal] Attempt to set an outdated global');
  });

  test('Assert when setting more than once', () => {
    initGlobal();

    const global = getUntypedGlobal();

    expect(() => {
      setUntypedGlobal({ ...global });
    }).not.toThrow();

    expect(() => {
      setUntypedGlobal({ ...global });
    }).toThrow('[TeactN.setGlobal] Attempt to set an outdated global');
  });
});

describe('Ensure actions order', () => {
  test('Actions are always run consequently', async () => {
    const order: number[] = [];

    await new Promise<void>((resolve, reject) => {
      addUntypedActionHandler('action1', (global, actions): ActionReturnType => {
        order.push(1);
        actions.action2();
        order.push(2);
      });

      addUntypedActionHandler('action2', (global, actions): ActionReturnType => {
        actions.action3();
        order.push(3);
      });

      // Make sure order is kept for sync parts of async action handlers
      addUntypedActionHandler('action3', async (global, actions): Promise<void> => {
        order.push(4);
        actions.action4();
        order.push(5);
        await Promise.resolve();
        order.push(7);

        try {
          expect(order).toEqual([1, 2, 3, 4, 5, 6, 7]);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      addUntypedActionHandler('action4', (): ActionReturnType => {
        order.push(6);
      });

      getUntypedActions().action1();
    });
  });
});

function initGlobal() {
  setUntypedGlobal({});
}
