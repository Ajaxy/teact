// Teact's additions to React's JSX types (@types/react), for both JSX runtimes. The package's index.d.ts,
// jsx-runtime.d.ts and jsx-dev-runtime.d.ts reference this file, so it is loaded when an app imports `@teact/core` or
// compiles JSX with `jsxImportSource: '@teact/core'`.
//
// Apps need `skipLibCheck: true`: the Teact `ref` below differs from the `ref` that React declares in `RefAttributes`.
/* eslint-disable @typescript-eslint/no-unused-vars -- type parameters must match React's declarations */

export {};

declare module 'react' {
  interface HTMLAttributes<T> {
    // Optimization for DOM nodes prepends and inserts
    teactFastList?: boolean;
  }

  // Teact features
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-wrapper-object-types
  interface CSSProperties extends String {}

  interface ClassAttributes<T> extends RefAttributes<T> {
    ref?: ((instance: T | undefined) => void) | RefObject<T | undefined> | undefined; // Teact ref
  }

  interface Attributes {
    // Optimization for DOM nodes reordering. Requires `teactFastList` for parent
    teactOrderKey?: number;
  }

  interface VideoHTMLAttributes<T> {
    srcObject?: MediaStream;
    defaultMuted?: boolean;
  }

  interface MouseEvent<T, E> {
    offsetX: number;
    offsetY: number;
  }

  interface KeyboardEvent<T> {
    isComposing: boolean;
  }
}
