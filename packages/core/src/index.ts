// `@teact/core`: components, hooks, signals and heavy-animation helpers.
// Teact's JSX props, for programs that compile against the source (dist/index.d.ts gets the same reference at build)
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./jsx.d.ts" />

export { default } from './lib/teact/teact';
export {
  createElement,
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
export { installTeactDevTools } from './devtools';
