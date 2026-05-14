import { useRef } from '../teact/teact';
import type { Signal } from '../util/signals';

import useForceUpdate from './useForceUpdate';
import { useSignalEffect } from './useSignalEffect';
import { useStateRef } from './useStateRef';
import useSyncEffect from './useSyncEffect';

type SyncResolver<T> = () => T;
type AsyncResolver<T> = (setter: (newValue: T) => void) => void;
type Resolver<T> =
  SyncResolver<T>
  | AsyncResolver<T>;

export default function useDerivedState<T>(
  resolverOrSignal: Resolver<T> | Signal<T> | T,
  dependencies?: readonly any[],
  isAsync = false,
): T {
  const resolver = dependencies
    ? (resolverOrSignal as Resolver<T>)
    : () => ((resolverOrSignal as Signal<T>)());
  const deps = dependencies ?? [resolverOrSignal];

  const valueRef = useRef<T>();
  const forceUpdate = useForceUpdate();
  const resolverRef = useStateRef(resolver);

  function runCurrentResolver(isSync = false) {
    const currentResolver = resolverRef.current;
    if (isAsync) {
      (currentResolver as AsyncResolver<T>)((newValue) => {
        if (valueRef.current !== newValue) {
          valueRef.current = newValue;
          forceUpdate();
        }
      });
    } else {
      const newValue = (currentResolver as SyncResolver<T>)();
      if (valueRef.current !== newValue) {
        valueRef.current = newValue;

        if (!isSync) {
          forceUpdate();
        }
      }
    }
  }

  useSyncEffect(() => {
    runCurrentResolver(true);
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, deps as any);

  useSignalEffect(runCurrentResolver, deps);

  return valueRef.current as T;
}
