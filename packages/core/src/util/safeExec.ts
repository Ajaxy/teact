import type { AnyFunction, NoneToVoidFunction } from '../types';

import { reportError } from '../errors';

type SafeExecOptions = {
  rescue?: (err: Error) => void;
  always?: NoneToVoidFunction;
  shouldIgnoreError?: boolean;
};

export default function safeExec<T extends AnyFunction>(cb: T, options?: SafeExecOptions): ReturnType<T> | undefined {
  const { rescue, always, shouldIgnoreError } = options ?? {};

  try {
    return cb();
  } catch (err: any) {
    rescue?.(err);
    if (!shouldIgnoreError) {
      reportError(err);
    }
    return undefined;
  } finally {
    always?.();
  }
}
