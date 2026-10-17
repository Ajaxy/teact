// `@teact/core/fasterdom`: measure/mutate scheduling, strict mode, and the scheduler primitives that Teact uses.
// Apps re-export these schedulers instead of keeping their own copies, so there is a single rAF and tick-end batch.

export {
  requestMeasure,
  requestMutation,
  requestNextMutation,
  requestForcedReflow,
  setPhase,
  getPhase,
  enableStrict,
  disableStrict,
  forceMeasure,
  forceMutation,
  suppressStrict,
  setHandler,
} from './lib/fasterdom/fasterdom';
export {
  fastRaf,
  onTickEnd,
  onIdle,
  throttleWith,
  throttleWithTickEnd,
} from './util/schedulers';
export type { Scheduler } from './util/schedulers';
