// Stand-in for Web A's src/hooks/data/useContext.ts (`useContextSignal` plus `useDerivedState`): returns the context
// value and re-renders the component when it changes
import {
  type Context, type Signal, useContextSignal, useRef, useState, useUnmountCleanup,
} from '@teact/core';

export default function useContext<T>(context: Context<T>) {
  const getValue = useContextSignal(context);
  // eslint-disable-next-line @eslint-react/use-state
  const [, setVersion] = useState(0);
  const subscriptionRef = useRef<{ signal: Signal<T>; unsubscribe: () => void }>();

  if (subscriptionRef.current?.signal !== getValue) {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = {
      signal: getValue,
      unsubscribe: getValue.subscribe(() => setVersion((version) => version + 1)),
    };
  }

  useUnmountCleanup(() => {
    subscriptionRef.current?.unsubscribe();
  });

  return getValue();
}
