# Differences from React

Teact's API looks like React's: function components, hooks and JSX, with React's JSX types. Its renderer works differently, though, and some React APIs are missing. This page lists what behaves differently in `@teact/core` 0.1, for anyone porting React code or reviewing Teact code with React habits.

The browser test suites in [`packages/core/test/browser`](../../packages/core/test/browser) check most of the behaviour described here. Bugs that the tests pin on purpose are listed in [KNOWN-ISSUES.md](../../KNOWN-ISSUES.md).

## Children are diffed by position, unless the parent has `teactFastList`

React matches the children of an element by `key`, so a keyed item keeps its DOM node and state when items are inserted before it or reordered.

Teact matches children by position. A `key` only decides whether the element at a position is still the same one: when the key at a position changes, Teact unmounts the old element and mounts the new one there. Inserting an item at the start of a keyed list therefore re-creates every item after it, and a reordered item is re-created rather than moved.

```tsx
// ['a', 'b'] → ['a', 'c', 'b']: <li key="a"> is kept; "c" replaces "b" at position 1, and a new "b" is created
<ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
```

For lists whose items are inserted, removed or reordered, set `teactFastList` on the parent DOM element. Its children are then matched by key:

- New children are inserted in batches, also at the start of the list, and removed children are removed. The others keep their DOM nodes and state.
- A child that stays in the list moves when its position among the remaining children changes. With a `teactOrderKey`, such as the value that the list is sorted by, it moves only when that key changes: when one item jumps to another place, only that item moves, not the ones it shifts. A `teactOrderKey` of `0` counts as none. A move uses `Element.moveBefore` where the browser supports it, so the node keeps its focus, iframe state and running animations.
- Every child needs a unique `key`. The development build warns about a missing key, and a duplicate key throws `[Teact] Children keys are not unique`. Children must be elements, not fragments.
- `teactFastList` works on DOM elements only. On a component it is just a prop.

```tsx
<ul teactFastList>
  {sortedMessages.map((message) => (
    <MessageItem key={message.id} teactOrderKey={message.date} message={message} />
  ))}
</ul>
```

Currently, the DOM order can drift from the order of the children: for example, reordering children without changing any `teactOrderKey` leaves the DOM in the old order (KNOWN-ISSUES.md, H33).

## Updates are applied in the next animation frame

Teact never renders synchronously in response to a state change. `setState` (and a TeactN `setGlobal` that changes a component's mapped props) schedules an update pass for the next animation frame, and all updates made until then are applied together. Code that runs right after `setState`, in the same task or in a microtask, still sees the old DOM. There is no `flushSync`.

A state setter skips the update when the new value is identical (`===`) to the pending one. An updater function, `setCount((count) => count + 1)`, receives the pending value, so several updaters in one frame add up.

`render(element, container)` from `@teact/core/dom` is synchronous: it mounts or updates the tree before it returns, and it runs the layout effects of that render before it returns as well.

While a **blocking heavy animation** runs (`beginHeavyAnimation(duration, true)`), Teact holds back the whole update pass, including effects and after-render callbacks, until the animation ends. During any heavy animation, blocking or not, TeactN holds back global-state updates.

## Effect timing

Each animation frame that Teact uses has a measure phase and then a mutate phase ([Fasterdom](https://ajaxy.github.io/teact/Fasterdom-Optimized-Browser-Rendering/)). An update pass runs like this:

| Frame | Phase | What runs |
|---|---|---|
| Frame 1 | measure | Cleanups and then effects (`useEffect`) scheduled by the previous update |
| Frame 1 | mutate | Component renders and DOM changes; then layout effect cleanups and layout effects (`useLayoutEffect`); then after-render callbacks |
| Frame 2 | measure | Cleanups and then effects (`useEffect`) of the renders in frame 1 |

So:

- `useLayoutEffect` runs in the same frame as the DOM changes, right after them, like in React. It runs in the mutate phase: changing the DOM there is fine, but reading layout forces a reflow. Read layout in a `requestMeasure` callback, or use `requestForcedReflow` when the measurement must happen in this frame.
- `useEffect` runs in the measure phase of the next animation frame, where the browser has computed layout, so reading it is cheap. Write to the DOM from a `useEffect` through `requestMutation`. In React, effects usually run after the browser paints, with no phase rule.
- `requestMeasure`, `requestMutation`, `requestNextMutation` and `requestForcedReflow` from `@teact/core/fasterdom` schedule app work into the same frames. `enableStrict()` reports layout reads made outside the measure phase and attribute changes made outside the mutate phase. It does not report changes of text or of `data-*` attributes, and in 0.1 it does not report nodes inserted into or removed from HTML elements either (KNOWN-ISSUES.md, K2).

## Effect order

Within a component, effects run in the order they are declared, as in React. Across components, React runs effects child first and siblings in their order: for a parent P with children A and B, React runs A, B, P.

Teact orders effects by the order in which the components were mounted, latest first. Children mount after their parent, so they still run first, but later siblings run before earlier ones:

| | React | Teact |
|---|---|---|
| Mount and update: layout effects, effects, and the cleanups before an update | A, B, P | B, A, P |
| P has children A (with a child A1) and B | A1, A, B, P | B, A1, A, P |
| Unmount | Layout effect cleanups during the commit, the other cleanups after it | All cleanups, including those of `useEffect`, run right away during the unmount: P, A, B, and within a component in declaration order |

In each update pass, all cleanups of one kind run before the effects of that kind, as in React. A component that mounts later, such as a new list item, runs its effects before those of the components that mounted earlier, its parent included.

This order is not planned to change during 0.x.

## Controlled inputs are reconciled after the next render

An `input`, `textarea` or `select` with a defined `value` or `checked` prop is controlled. `onChange` is called for `input` events, as in React.

React restores a controlled value synchronously, right after the event handler, when the state did not take the new value. Teact leaves the browser's edit in place and reconciles the element after the next render:

- The typed value, or the toggled checkbox, stays visible until the next update pass, which normally comes in the next animation frame. Then Teact sets the element back to the `value` or `checked` prop, so a rejected or transformed edit is corrected one frame later. When the caret was at the end of the value, it stays at the end; otherwise Teact restores the selection that the element had after the edit.
- A rejected click in a radio group with a `name` restores the radio that was checked.
- While an IME composition is in progress (Chinese, Japanese and other input methods), Teact neither writes the value nor reconciles it, so the composition is not interrupted. It reconciles once the composition ends.
- While a heavy animation runs, the reconciliation waits until it ends, because TeactN holds back global-state updates until then. A rejected edit can stay visible for the duration of the animation.
- `value` is written again on every render in which it differs from the element's value. `checked` is written when the prop changes and after the user toggles the element, but not on every render, so a change made to `checked` from outside Teact stays until one of those happens.
- After a rejected keystroke in the middle of the text, the caret is currently restored one character to the right of where it was (KNOWN-ISSUES.md, K1).

`defaultValue` and `defaultChecked` are applied when the element is created.

## `autoFocus` does not focus elements that mount later

React calls `focus()` itself when an element with `autoFocus` mounts. Teact only sets the element's `autofocus` attribute (the `autofocus` property), and browsers apply that attribute when the page loads and when a `<dialog>` or popover opens. They do not focus an element that is inserted later. To focus an element when it mounts, call `focus()` from an effect:

```tsx
function SearchField() {
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    inputRef.current!.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

## `memo` has no comparison function

`memo(Component)` re-renders the component when any of its prop values changes. It compares the values with `===` in the order in which the props are listed (`Object.values(props)`), not by name: props `{ a: 1 }` followed by `{ b: 1 }` count as equal, and the component does not re-render. There is no second argument for a custom comparison; the second argument of Teact's `memo` is a debug key.

As in React, a function or object created during the parent's render is a new value every time, which defeats `memo`. Pass functions made with `useCallback` (or that do not depend on render) and keep props in the same order at a call site.

## Events are native, and most are delegated

Handlers receive the browser's event, not a synthetic one. `onFocus` and `onBlur` listen to `focusin` and `focusout`, and `onChange` listens to `input` (except on an uncontrolled `select`, where it listens to `change`).

Most handlers are delegated: Teact listens on `document` and calls the handlers of the target element and of its ancestors. `stopPropagation()` stops the delegated handlers of outer elements, and `currentTarget` is the element whose handler runs. Teact attaches a handler to the element itself only in these cases:

- capture handlers, such as `onClickCapture`;
- handlers on `<video>` and `<iframe>`;
- these five events, which do not bubble: `scroll`, `mouseenter`, `mouseleave`, `load` and `error`.

Every other event that does not bubble is delegated as well. It never reaches `document`, so in 0.1 **its handler is never called**, with no warning (KNOWN-ISSUES.md, H32). This affects:

- `onPointerEnter` and `onPointerLeave`;
- `onToggle` and `onBeforeToggle` (`<details>` and popovers);
- `onClose` and `onCancel` on `<dialog>`;
- `onInvalid`;
- `onScrollEnd`;
- the media events of `<audio>`, such as `onPlay`, `onPause`, `onEnded`, `onTimeUpdate` and `onLoadedMetadata` (on `<video>` they work).

Instead of `onPointerEnter` and `onPointerLeave`, use `onMouseEnter` and `onMouseLeave`, or `onPointerOver` and `onPointerOut`. For the other events, add a listener to the element through a ref:

```tsx
function Details({ onToggle }: { onToggle: (isOpen: boolean) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>();

  useEffect(() => {
    const details = detailsRef.current!;
    const handleToggle = () => onToggle(details.open);

    details.addEventListener('toggle', handleToggle);
    return () => details.removeEventListener('toggle', handleToggle);
  }, [onToggle]);

  return (
    <details ref={detailsRef}>
      <summary>More</summary>
      …
    </details>
  );
}
```

## Other differences

- **Context** is read as a signal: `useContextSignal(Context)` returns a signal, not the value. Call it to read the current value, and list it in an effect's dependencies to react to changes: a new context value does not by itself re-render the components that read it. There is no `useContext`. Context does not reach content that a component renders into another root with `render()`, such as a portal made that way (KNOWN-ISSUES.md, K4); React's `createPortal` keeps context.
- **Props become DOM properties.** Teact assigns most props as properties (`element[name] = value`). `data-*`, `aria-*`, `role`, `dir` and `form` are set as attributes, and so is every prop of an SVG element. Use `className`; a few camel-cased names (`autoFocus`, `autoComplete`, `autoCapitalize`, `autoCorrect`, `autoPlay`, `spellCheck` and `srcDoc`) are mapped to their lower-case properties.
- **`style` is a string**, assigned to `style.cssText`: `style="width: 10px; color: red"`. Objects are not supported. `setExtraStyles` from `@teact/core/dom` sets styles, including custom properties, that survive re-renders.
- **Refs** are set to `undefined`, not `null`, when an element unmounts, and `useRef()` may be called without an initial value. An object ref's optional `onChange` is called whenever Teact changes `current`. Each time the component that renders an element re-renders, Teact sets the element's ref to `undefined` and back to the element: a callback ref is called twice, with `undefined` and then with the element, and `onChange` runs twice. React leaves both alone when the ref and the element stay the same. Keep ref callbacks idempotent and cheap.
- **`ref` and `key` are ordinary props for components.** `forwardRef` is not needed: pass the `ref` prop on to an element, as in React 19. A component also receives its `key` in its props.
- **Empty children:** `false`, `null`, `undefined`, `''` and `NaN` render nothing, and `0` renders as text. `true` renders as the text `true`, where React renders nothing, so a child expression must never evaluate to `true`: write `cond ? <X /> : undefined`, or `cond && <X />` with a boolean `cond`.
- **Hook dependencies** are compared with `===` (React uses `Object.is`, which differs for `NaN` and `-0`). A signal in an effect's dependencies re-runs the effect when the signal changes.
- **Errors:** when a component throws while rendering, Teact reports the error to `configureTeact({ onError })` and keeps the component's previous output (nothing, when the component had not rendered before). An effect or cleanup that throws is reported and skipped. Errors thrown by event handlers are not caught.
- **`useUnmountCleanup(cleanup)`** runs a function when the component unmounts, without an effect.
- **No development double rendering.** There is no `StrictMode`; components and effects run once per render.

## APIs that Teact does not have

| React API | In Teact |
|---|---|
| Class components | Not supported; use function components |
| `useReducer` | Not provided; use `useState` with a reducer function |
| `useId` | Not provided |
| `forwardRef` | Not needed: `ref` is an ordinary prop of components |
| `useImperativeHandle` | Not provided; pass a callback or an object ref as a prop |
| Error boundaries | Not supported; see Errors above |
| `Suspense`, `lazy`, `use` | Not supported; load code with `import()` and render it when it has loaded |
| Server rendering and hydration (`react-dom/server`, `hydrateRoot`) | Not supported; Teact renders in the browser only |
| `useContext` | `useContextSignal`, which returns a signal |
| `useSyncExternalStore`, `useTransition`, `useDeferredValue`, `startTransition`, `useOptimistic`, `useActionState`, `useInsertionEffect`, `useDebugValue` | Not provided |
| `createPortal` | Not provided; render into another container with `render()` (context does not cross it) |
| `createRoot`, `flushSync` | `render(element, container)`, which is synchronous |
| `Children`, `cloneElement`, `isValidElement`, `createRef`, `StrictMode`, `Profiler` | Not provided |
