import {
  getIsHeavyAnimating,
  useCallback, useEffect, useMemo, useRef,
} from '../teact/teact';

import { createCallbackManager } from '../util/callbacks';
import useLastCallback from './useLastCallback';

export const startCallbacks = createCallbackManager();
export const endCallbacks = createCallbackManager();

getIsHeavyAnimating.subscribe(() => {
  if (getIsHeavyAnimating()) {
    startCallbacks.runCallbacks();
  } else {
    endCallbacks.runCallbacks();
  }
});

export default function useHeavyAnimation(
  onStart?: AnyToVoidFunction,
  onEnd?: AnyToVoidFunction,
  isDisabled = false,
) {
  const lastOnStart = useLastCallback(onStart);
  const lastOnEnd = useLastCallback(onEnd);

  useEffect(() => {
    if (isDisabled) {
      return undefined;
    }

    if (getIsHeavyAnimating()) {
      lastOnStart();
    }

    startCallbacks.addCallback(lastOnStart);
    endCallbacks.addCallback(lastOnEnd);

    return () => {
      endCallbacks.removeCallback(lastOnEnd);
      startCallbacks.removeCallback(lastOnStart);
    };
  }, [isDisabled, lastOnEnd, lastOnStart]);
}
