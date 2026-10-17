// The Teact-specific JSX props from Telegram Web A's `src/@types/global.d.ts`, as a module augmentation.
// TODO(B3): Remove once the package ships its own `jsx.d.ts`.
import 'react';

declare module 'react' {
  // The type parameter must match React's declaration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}
