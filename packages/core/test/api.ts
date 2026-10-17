// The public API of each entry point, as listed in the plan (§3c). test/unit/api.test.ts checks the source against it,
// test/package/api.test.ts both builds and their declarations. Changing a list changes the API.

export const RUNTIME_EXPORTS: Record<string, readonly string[]> = {
  '@teact/core': [
    // The classic JSX runtime and components
    'default', 'createElement', 'Fragment', 'memo',
    // Hooks
    'useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef', 'useSignal', 'useUnmountCleanup',
    'createContext', 'useContextSignal',
    // Signals
    'createSignal', 'isSignal', 'cleanupEffect',
    // Heavy animations
    'beginHeavyAnimation', 'getIsHeavyAnimating', 'onFullyIdle', 'throttleWithFullyIdle',
    // Runtime
    'configureTeact', 'installTeactDevTools',
  ],
  '@teact/core/dom': ['default', 'render', 'addExtraClass', 'removeExtraClass', 'toggleExtraClass', 'setExtraStyles'],
  '@teact/core/teactn': [
    'typify', 'addCallback', 'removeCallback', 'getUntypedGlobal', 'setUntypedGlobal', 'getUntypedActions',
    'addUntypedActionHandler', 'withUntypedGlobal', 'execAfterActions', 'installTeactNDevTools',
  ],
  '@teact/core/fasterdom': [
    'requestMeasure', 'requestMutation', 'requestNextMutation', 'requestForcedReflow', 'setPhase', 'getPhase',
    'enableStrict', 'disableStrict', 'forceMeasure', 'forceMutation', 'suppressStrict', 'setHandler',
    // The scheduler primitives that Teact uses, for the apps to re-export
    'fastRaf', 'onTickEnd', 'onIdle', 'throttleWith', 'throttleWithTickEnd',
  ],
  '@teact/core/jsx-runtime': ['jsx', 'jsxs', 'jsxDEV', 'Fragment'],
  '@teact/core/jsx-dev-runtime': ['jsx', 'jsxs', 'jsxDEV', 'Fragment'],
  // No semver guarantee
  '@teact/core/internal': [
    'VirtualType', 'MountState', 'isParentElement', 'renderComponent', 'mountComponent', 'unmountComponent',
    'hasElementChanged', 'captureImmediateEffects', 'requestAfterRender', 'isElementUsed', 'cloneElement',
    'DEBUG_resolveComponentName', 'resolveEventType', 'addEventListener', 'removeEventListener',
    'removeAllDelegatedListeners', 'getIsBlockingAnimating', 'forceOnHeavyAnimationOnce',
  ],
};

export const TYPE_EXPORTS: Record<string, readonly string[]> = {
  '@teact/core': [
    'FC', 'Props', 'TeactNode', 'ElementRef', 'RefObject', 'StateHookSetter', 'Context', 'VirtualElement', 'Signal',
    'SignalSetter', 'TeactConfig',
  ],
  '@teact/core/dom': [],
  '@teact/core/teactn': ['ActionOptions'],
  '@teact/core/fasterdom': ['Scheduler'],
  '@teact/core/jsx-runtime': ['JSX'],
  '@teact/core/jsx-dev-runtime': ['JSX'],
  '@teact/core/internal': [
    'FC_withDebug', 'VirtualElementTag', 'VirtualElementComponent', 'VirtualElementFragment', 'VirtualElementParent',
    'VirtualElementChildren', 'VirtualElementReal',
  ],
};
