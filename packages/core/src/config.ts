// Temporary boundary shim for Web A's `src/config.ts`, so the imported files build unchanged.
// TODO(B3): Replace with `env.ts` and remove `IS_PERF`.

// The `typeof` guards keep this working when the source is consumed without the build-time defines
export const DEBUG = typeof __TEACT_DEV__ !== 'undefined' && __TEACT_DEV__;
export const DEBUG_MORE = typeof __TEACT_DEBUG_MORE__ !== 'undefined' && __TEACT_DEBUG_MORE__;
export const IS_PERF = false;
