// Build-time flags. tsdown's `define` replaces the two constants below (see tsdown.config.ts): `dist/dev`, which the
// `teact-dev` export condition selects, is built with `__TEACT_DEV__` set to true, and `dist` with it set to false.
// `__TEACT_DEBUG_MORE__` (verbose render logs) is false in both builds.
// The `typeof` guards keep the source working when it is compiled without the defines.
declare const __TEACT_DEV__: boolean | undefined;
declare const __TEACT_DEBUG_MORE__: boolean | undefined;

export const DEBUG = typeof __TEACT_DEV__ !== 'undefined' && __TEACT_DEV__;
export const DEBUG_MORE = typeof __TEACT_DEBUG_MORE__ !== 'undefined' && __TEACT_DEBUG_MORE__;
