# @teact/core

**Teact** is a small UI library with a React-like API whose renderer schedules DOM work in animation frames. It powers [Telegram Web A](https://web.telegram.org/a) and [MyTonWallet](https://mytonwallet.io).

> **Status: pre-release.** `0.1.0-next.N` versions are published under the `next` dist-tag. Any 0.x release may change the API or behaviour, so pin exact versions.

```sh
npm install @teact/core@next
```

Setup (JSX runtimes, the `teact-dev` condition, TypeScript), the motivation and the links are in the [main README](https://github.com/Ajaxy/teact#readme). Read [Differences from React](https://github.com/Ajaxy/teact/blob/main/docs/guide/differences-from-react.md) before porting React code.

## API by entry point

### `@teact/core`

- **Default export:** `{ createElement, Fragment }`, for the classic JSX runtime (`import React from '@teact/core'`).
- **Elements:** `createElement`, `Fragment`, `memo(Component)`.
- **Hooks:** `useState`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`, `useRef`, `useUnmountCleanup`, `useSignal`, `createContext`, `useContextSignal`.
- **Signals:** `createSignal(initial)` returns `[getter, setter]`; the getter is the signal, with `subscribe` and `once`. `isSignal` and `cleanupEffect` complete the set. A signal in an effect's dependencies re-runs the effect when its value changes.
- **Heavy animations:** `beginHeavyAnimation(duration?, isBlocking?)` returns a function that ends the animation. `getIsHeavyAnimating` is a signal. `onFullyIdle(callback)` and `throttleWithFullyIdle(fn)` wait until no heavy animation runs.
- **Runtime:** `configureTeact({ onError })` routes the errors that Teact catches (default: `console.error`). `installTeactDevTools()` adds a double-click dump of render statistics in the development build and returns a function that removes it; in the production build it does nothing.
- **Types:** `FC`, `Props`, `TeactNode`, `ElementRef`, `RefObject`, `StateHookSetter`, `Context`, `VirtualElement`, `Signal`, `SignalSetter`, `TeactConfig`.

### `@teact/core/dom`

- `render(element, container)` renders synchronously and returns `undefined`; `render(undefined, container)` unmounts. The default export is `{ render }`.
- `addExtraClass`, `removeExtraClass`, `toggleExtraClass` and `setExtraStyles` change classes and styles of an element that Teact renders, and keep them through its re-renders.

### `@teact/core/teactn`

- `typify<GlobalState, ActionPayloads>()` returns the typed API: `getGlobal`, `setGlobal`, `getActions`, `getPromiseActions`, `addActionHandler`, `withGlobal` and `execAfterActions`.
- The untyped functions behind it: `getUntypedGlobal`, `setUntypedGlobal`, `getUntypedActions`, `addUntypedActionHandler`, `withUntypedGlobal`, and `addCallback` and `removeCallback` for global-state listeners.
- `installTeactNDevTools()` adds `window.getGlobal`, `window.setGlobal` and `window.getActions` and a double-click dump of container updates, in the development build only. Type: `ActionOptions`.

### `@teact/core/fasterdom`

- **Frame scheduling:** `requestMeasure`, `requestMutation`, `requestNextMutation`, `requestForcedReflow`, and `getPhase` and `setPhase`.
- **StricterDOM:** `enableStrict`, `disableStrict`, `setHandler` (where violations are reported), `forceMeasure`, `forceMutation` and `suppressStrict`. DOM changes under an element with `data-stricterdom-ignore` are not reported.
- **Schedulers:** `fastRaf`, `onTickEnd`, `onIdle`, `throttleWith`, `throttleWithTickEnd`, and the `Scheduler` type. Re-export these from an app instead of keeping copies, so that there is a single frame and tick-end batch.

### `@teact/core/jsx-runtime` and `@teact/core/jsx-dev-runtime`

`jsx`, `jsxs`, `jsxDEV`, `Fragment` and the `JSX` type, for `jsxImportSource: '@teact/core'`.

### `@teact/core/internal`

Renderer internals for tests and tooling, such as `VirtualType`, `requestAfterRender` and `resolveEventType`. They have **no semver guarantee** and can change in any release.

## Builds

The package is ESM only and has no runtime dependencies. The `default` export condition selects the production build; the `teact-dev` condition selects the development build, with warnings, checks and the debugging aids. TypeScript projects need `@types/react` 19.1 or newer and `skipLibCheck: true`.

## License

[MIT](https://github.com/Ajaxy/teact/blob/main/packages/core/LICENSE)
