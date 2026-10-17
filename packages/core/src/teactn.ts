// `@teact/core/teactn`: the global state container.
// TODO(B3): Add `installTeactNDevTools`.

export {
  typify,
  addCallback,
  removeCallback,
  getUntypedGlobal,
  setUntypedGlobal,
  getUntypedActions,
  addUntypedActionHandler,
  withUntypedGlobal,
  execAfterActions,
} from './lib/teact/teactn';
export type { ActionOptions } from './lib/teact/teactn';
