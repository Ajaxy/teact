// `@teact/core`: components, hooks, signals, heavy-animation helpers and the runtime configuration.
// Teact's JSX props, for programs that compile against the source (dist/index.d.ts gets the same reference at build)
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./jsx.d.ts" />

// The default export, `{ createElement, Fragment }`, is what the classic JSX runtime needs
export {
  default,
  createElement,
  Fragment,
  memo,
} from './lib/teact/teact';

// Hooks
export {
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

// Signals
export { createSignal, isSignal, cleanupEffect } from './util/signals';
export type { Signal, SignalSetter } from './util/signals';

// Heavy animations
export {
  beginHeavyAnimation,
  getIsHeavyAnimating,
  onFullyIdle,
  throttleWithFullyIdle,
} from './lib/teact/heavyAnimation';

// Runtime
export { configureTeact } from './errors';
export type { TeactConfig } from './errors';
export { installTeactDevTools } from './devtools';
