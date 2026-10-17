# Known issues pinned by tests

The test suites describe how Teact behaves now, including a few behaviours that are bugs or limitations. Each test
that pins one of them says so in its title ("currently …") and in a `KNOWN ISSUE <id>` comment. A fix flips the
assertion on purpose: update the test and its title, and remove the entry here.

0.1 keeps Telegram Web A's behaviour, so none of these change before 0.2 unless the entry says otherwise.

| ID | Behaviour now | Expected | Pinned by | Fix |
|---|---|---|---|---|
| H20/H21 | `isSignal` does not recognise a signal created by another copy of the module: the mark is a module-local `Symbol()` | Signals from any copy are recognised | `packages/core/test/unit/signals.test.ts` | B3: `Symbol.for('teact.signal')` |
| H33 | In a `teactFastList`, preserved children move only when their `teactOrderKey` changes, so reordering them without changing any order key leaves the DOM order | The DOM follows the order of the children | `e2e/specs/TestOrdered.spec.ts` | 0.2 (T-fastorder) |
| K1 | When a controlled input rejects a character typed in the middle of its value, the value is restored, but the caret goes to the position saved after the keystroke: one character to the right. In `hll` with the caret after `h`, a rejected `a` leaves the caret after `hl`, and a following `x` gives `hlxl` | The caret stays where the user typed, so `x` gives `hxll` | `packages/core/test/browser/controlled.test.tsx`, `e2e/specs/TestControlledInput.spec.ts` | 0.2 or later |
| K2 | stricterdom never reports child-list changes of HTML elements: the check meant to exempt `contentEditable` elements reads `element.contentEditable`, a non-empty string (`'inherit'`) on every HTML element | Only content-editable elements are exempt (`isContentEditable`) | `packages/core/test/browser/strict.test.tsx` | 0.2 or later |
| K3 | TeactN: when a container's mapper throws, the error is reported and the update pass stops there, so the containers after it miss the update (and every later one, for as long as the mapper throws) | The other containers are updated | `packages/core/test/browser/teactn.test.tsx` | 0.2 or later |
| K4 | Context does not reach the content of a Portal: Web A's `Portal` renders its children into a separate Teact root, outside the providers around it (React's `createPortal` keeps context) | Not decided: a limitation of Teact's design, to be listed in "Differences from React" | `e2e/specs/regressions.spec.ts` (with the e2e stand-in for Web A's `Portal`) | Not scheduled |
