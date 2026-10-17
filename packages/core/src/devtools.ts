import { DEBUG_logDelegationStats } from './lib/teact/dom-events';
import { DEBUG_logRenderStats } from './lib/teact/teact';

import type { NoneToVoidFunction } from './types';

import { DEBUG } from './env';

/**
 * Installs Teact's debugging aids: a double click anywhere logs the render counts and times of components, the hit
 * rates of memos and the counts of delegated event handlers. They work in the development build (the `teact-dev`
 * export condition); in the production build this does nothing. Returns a function that removes them.
 *
 * TeactN has its own: `installTeactNDevTools()` from `@teact/core/teactn`.
 */
export function installTeactDevTools(): NoneToVoidFunction {
  if (!DEBUG) {
    return noop;
  }

  const logStats = () => {
    DEBUG_logRenderStats();
    DEBUG_logDelegationStats();
  };
  document.addEventListener('dblclick', logStats);

  return () => {
    document.removeEventListener('dblclick', logStats);
  };
}

function noop() {}
