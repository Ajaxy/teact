// `@teact/core/internal`: renderer internals for tests and tooling. No semver guarantee.

export {
  VirtualType,
  MountState,
  isParentElement,
  renderComponent,
  mountComponent,
  unmountComponent,
  hasElementChanged,
  captureImmediateEffects,
  requestAfterRender,
  isElementUsed,
  cloneElement,
  DEBUG_resolveComponentName,
} from './lib/teact/teact';
export type {
  FC_withDebug,
  VirtualElementTag,
  VirtualElementComponent,
  VirtualElementFragment,
  VirtualElementParent,
  VirtualElementChildren,
  VirtualElementReal,
} from './lib/teact/teact';
export {
  resolveEventType,
  addEventListener,
  removeEventListener,
  removeAllDelegatedListeners,
} from './lib/teact/dom-events';
export { getIsBlockingAnimating } from './lib/teact/heavyAnimation';
export { forceOnHeavyAnimationOnce } from './lib/teact/teactn';
