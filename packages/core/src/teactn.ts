// `@teact/core/teactn`: the global state container.

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
  installTeactNDevTools,
} from './lib/teact/teactn';
export type { ActionOptions } from './lib/teact/teactn';
