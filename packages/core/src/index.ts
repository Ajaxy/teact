// `@teact/core`: components, hooks, signals and heavy-animation helpers.
// TODO(B3): Curate per the plan (§3c): drop `cloneElement` from the default and named exports,
// add `installTeactDevTools`.

export { default } from './lib/teact/teact';
export {
  createElement,
  cloneElement,
  Fragment,
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useSignal,
  useUnmountCleanup,
  createContext,
  useContextSignal,
  beginHeavyAnimation,
  getIsHeavyAnimating,
  onFullyIdle,
} from './lib/teact/teact';
export type {
  FC,
  Props,
  TeactNode,
  ElementRef,
  RefObject,
  StateHookSetter,
  Context,
  VirtualElement,
} from './lib/teact/teact';
export { throttleWithFullyIdle } from './lib/teact/heavyAnimation';
export { createSignal, isSignal, cleanupEffect } from './util/signals';
export type { Signal, SignalSetter } from './util/signals';
export { configureTeact } from './errors';
export type { TeactConfig } from './errors';
