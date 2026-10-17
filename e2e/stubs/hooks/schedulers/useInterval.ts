// Stand-in for Web A's src/hooks/schedulers/useInterval.ts: calls the latest callback every `delay` ms, and once right
// away unless `noFirst` is set
import { useEffect, useRef } from '@teact/core';

export default function useInterval(callback: () => void, delay?: number, noFirst = false) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delay === undefined) {
      return undefined;
    }

    const id = setInterval(() => callbackRef.current(), delay);
    if (!noFirst) callbackRef.current();

    return () => clearInterval(id);
  }, [delay, noFirst]);
}
