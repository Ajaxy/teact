// Stand-in for Web A's src/global/types: the parts of the global state that the test components read
import type { ApiUpdateAuthorizationStateType } from '../api/types';

export type GlobalState = {
  auth: {
    state?: ApiUpdateAuthorizationStateType;
  };
  isSyncing?: boolean;
};
