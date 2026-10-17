// Stand-in for Web A's src/global: a TeactN global with the state the test components read, and no actions
import { typify } from '@teact/core/teactn';

import type { GlobalState } from './types';

const typed = typify<GlobalState, Record<string, never>>();

export const getGlobal = typed.getGlobal;
export const setGlobal = typed.setGlobal;
export const withGlobal = typed.withGlobal;

setGlobal({
  auth: {
    state: 'authorizationStateReady',
  },
  isSyncing: false,
});
