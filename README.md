# Teact

Teact is a small UI library with a React-like API: function components, hooks and JSX. Its renderer is built around the browser's frame: it decides not only what changes in the DOM, but also when. Teact is the UI layer of [Telegram Web A](https://web.telegram.org/a) and [MyTonWallet](https://mytonwallet.io), and it is published on npm as [`@teact/core`](https://www.npmjs.com/package/@teact/core).

> [!NOTE]
> **Status: pre-release.** `0.1.0-next.N` versions are published under the `next` dist-tag. Until 1.0, any 0.x release may change the API or behaviour, so pin exact versions. Changes are listed in the [changelog](packages/core/CHANGELOG.md).

> [!IMPORTANT]
> This project is unrelated to the [`teact`](https://www.npmjs.com/package/teact) package on npm (CoffeeScript helpers for React, last released in 2017) and to the `@teactjs/*` packages (a Telegram bot framework).

## Why Teact

Teact's distinguishing feature is scheduling.

- **Frame phases (Fasterdom).** Each animation frame has a measure phase and a mutate phase, so layout reads and DOM writes do not interleave and force reflows. State updates are batched into the next frame. Components re-render and the DOM is patched in the mutate phase, `useLayoutEffect` runs right after the patch, and `useEffect` runs in the measure phase of the following frame, where reading layout is cheap. App code joins the same frame with `requestMeasure`, `requestMutation` and `requestForcedReflow` from `@teact/core/fasterdom`. The article [Fasterdom: Optimized Browser Rendering](https://ajaxy.github.io/teact/Fasterdom-Optimized-Browser-Rendering/) explains the model.
- **StricterDOM.** In development, `enableStrict()` reports layout reads made outside the measure phase, so forced reflows show up as errors instead of being found later in a profile. It also reports attribute changes made outside the mutate phase (except `data-*` attributes). In 0.1 it does not report nodes inserted into or removed from HTML elements ([known issue K2](KNOWN-ISSUES.md)).
- **Heavy-animation-aware updates.** `beginHeavyAnimation()` marks an animation in progress. While a blocking one runs, Teact holds back its whole update pass (renders, effects and after-render work), so the animation keeps its frames. TeactN holds back global-state updates during any heavy animation. `onFullyIdle` and `throttleWithFullyIdle` run work after the animations end.
- **Fast lists.** By default, children are diffed by position. With `teactFastList` on a parent element, its children are diffed by key instead: new items are inserted in batches, and existing nodes are moved rather than re-created. A `teactOrderKey` on the items limits the moves to the items whose order changed. Where the browser supports `Element.moveBefore`, moved nodes keep their focus and state.
- **Signals in hooks.** `createSignal` and `useSignal` hold values outside the render cycle. When an effect lists a signal among its dependencies, the effect runs again when the signal's value changes, and the component does not re-render. Components read context as a signal too, with `useContextSignal`.
- **TeactN.** A global state container with typed actions (`typify`). Components connect to it with `withGlobal(mapStateToProps)`, and a change of the global state re-renders only the components whose mapped props changed.

Teact is not a drop-in replacement for React. It has no class components, Suspense or server rendering, and several behaviours differ. Read [Differences from React](docs/guide/differences-from-react.md) before porting React code.

## Used by

- [Telegram Web A](https://web.telegram.org/a) ([source](https://github.com/Ajaxy/telegram-tt))
- [MyTonWallet](https://mytonwallet.io) ([source](https://github.com/mytonwallet-org/mytonwallet))

## Install

```sh
npm install @teact/core@next
```

For TypeScript, also install `@types/react` 19.1 or newer as a development dependency (see [TypeScript](#typescript)).

## Quick start

### Automatic JSX runtime

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@teact/core",
    "skipLibCheck": true
  }
}
```

`vite.config.ts` (Vite 8):

```ts
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Teact's development build on the dev server and in `vite build --mode development`
  const isDevTeact = command === 'serve' || mode === 'development';

  return {
    resolve: {
      conditions: isDevTeact ? ['teact-dev', ...defaultClientConditions] : [...defaultClientConditions],
    },
    oxc: {
      jsx: { runtime: 'automatic', importSource: '@teact/core' },
    },
  };
});
```

With Vite 7 or older, configure esbuild instead of oxc: `esbuild: { jsx: 'automatic', jsxImportSource: '@teact/core' }`.

`src/main.tsx`:

```tsx
import { useState } from '@teact/core';
import { render } from '@teact/core/dom';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}

render(<Counter />, document.getElementById('root')!);
```

### Classic JSX runtime

The default export of `@teact/core` is `{ createElement, Fragment }`, which is what the classic runtime calls as `React.createElement` and `React.Fragment`:

```tsx
// tsconfig.json: "jsx": "react"; vite.config.ts: oxc: { jsx: { runtime: 'classic' } }
import React, { useState } from '@teact/core';
import TeactDOM from '@teact/core/dom';

function Counter() {
  const [count, setCount] = useState(0);

  return <button type="button" onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}

TeactDOM.render(<Counter />, document.getElementById('root')!);
```

### Development build: the `teact-dev` condition

The package has two builds. The `default` export condition selects the production build. The `teact-dev` condition selects the development build, which adds:

- warnings about renders and effects that take longer than 7 ms;
- checks, for example a duplicate key in a fast list throws `[Teact] Children keys are not unique`;
- the debugging aids that `installTeactDevTools()` and `installTeactNDevTools()` install (in the production build they do nothing).

`teact-dev` is a condition of its own rather than the common `development` one, so that choosing Teact's build does not switch other packages to theirs. Add it to `resolve.conditions` for development and staging builds, as in the Vite config above, and to the Vitest config for tests that should use it. Jest resolves the `default` condition (the production build) unless its `testEnvironmentOptions.customExportConditions` lists `teact-dev`.

### Runtime setup

```ts
import { configureTeact, installTeactDevTools } from '@teact/core';
import { installTeactNDevTools } from '@teact/core/teactn';

// Errors that Teact catches: from renders, effects and their cleanups, Fasterdom tasks and TeactN mappers.
// The default is console.error. Teact never installs global error listeners.
configureTeact({ onError: (error) => myErrorTracker.capture(error) });

if (import.meta.env.DEV) {
  // A double click anywhere logs the render counts and times of components and the delegated event handlers
  installTeactDevTools();
  // Adds window.getGlobal, window.setGlobal and window.getActions, and logs TeactN container updates on double click
  installTeactNDevTools();
}
```

Importing Teact has no side effects: nothing is installed until these functions are called.

## TypeScript

- Install `@types/react` **19.1 or newer**. Teact's JSX types are React's (`React.JSX`), extended with Teact's own props: `teactFastList`, `teactOrderKey`, string `style` values and Teact refs. The package's entry points reference these additions, so they apply to both JSX runtimes.
- Set **`skipLibCheck: true`**. Teact's `ref` type differs from the one in `@types/react`, which TypeScript reports when it checks declaration files.
- The package's declarations are tested with TypeScript 5.8 and 6.0.

## Entry points

| Import | Contents |
|---|---|
| `@teact/core` | Components, hooks, signals, heavy animations, `configureTeact`, `installTeactDevTools` |
| `@teact/core/dom` | `render` and helpers for classes and styles set outside Teact |
| `@teact/core/teactn` | TeactN, the global state container |
| `@teact/core/fasterdom` | Measure and mutate scheduling, StricterDOM, scheduler primitives |
| `@teact/core/jsx-runtime`, `@teact/core/jsx-dev-runtime` | The automatic JSX runtime |
| `@teact/core/internal` | Renderer internals for tests and tooling, with no semver guarantee |

The [package README](packages/core/README.md) lists the exports of each entry point.

## Links

- [Differences from React](docs/guide/differences-from-react.md)
- [Changelog](packages/core/CHANGELOG.md)
- [Demo](https://ajaxy.github.io/teact/demo/) and [benchmark](https://ajaxy.github.io/teact/benchmark/)
- [Fasterdom: Optimized Browser Rendering](https://ajaxy.github.io/teact/Fasterdom-Optimized-Browser-Rendering/)
- [Contributing](CONTRIBUTING.md), [security policy](SECURITY.md) and [code of conduct](CODE_OF_CONDUCT.md)
- [Known issues](KNOWN-ISSUES.md) that the tests pin

## License

[MIT](LICENSE)
