---
'@teact/core': minor
---

First release of Teact as a package: the Teact of [Telegram Web A](https://github.com/Ajaxy/telegram-tt) (telegram-tt@f67a40879) made into a library. Its behaviour is Web A's, except for the changes below.

- Entry points: `@teact/core` (components, hooks, signals, heavy animations and `configureTeact`), `@teact/core/dom`, `@teact/core/teactn`, `@teact/core/fasterdom`, `@teact/core/jsx-runtime`, `@teact/core/jsx-dev-runtime`, and `@teact/core/internal`, which has no semver guarantee. The package is ESM only. It has a production build and a development build, which the `teact-dev` export condition selects.
- Importing Teact has no side effects. Errors that Teact catches go to `configureTeact({ onError })` (by default `console.error`), and Teact adds no global error listeners. The double-click debug dumps and `window.getGlobal`, `setGlobal` and `getActions` exist only after `installTeactDevTools()` and `installTeactNDevTools()`, and only in the development build.
- An `input`, `textarea` or `select` with a defined `value` or `checked` is always controlled: the `teactExperimentControlled` flag is gone. The reconciliation is IME-safe and runs after the next render, so a rejected edit stays visible until that update pass. While a heavy animation runs, the reconciliation waits for it to end. A rejected click in a named radio group restores the checked radio.
- `render()` returns `undefined`. `cloneElement` is no longer exported. Signals are marked with `Symbol.for('teact.signal')`, so `isSignal` also recognises signals created by another copy of the module.
- Teact's JSX props ship with the package's types. TypeScript projects need `@types/react` 19.1 or newer and `skipLibCheck`.
- Compared with MyTonWallet's copy of Teact, this release brings Web A's renderer changes, including its effect order: children before parents, later siblings first.
- Thanks to [@muhin-g-s](https://github.com/muhin-g-s), whose test harness and specs ([#6](https://github.com/Ajaxy/teact/pull/6), [#7](https://github.com/Ajaxy/teact/pull/7)) the end-to-end suite builds on.
