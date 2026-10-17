// Types that Web A's test components use without importing them, as declared in Web A's `src/@types/global.d.ts`:
// the Teact JSX props (as a module augmentation) and the `Complete` and `NoneToVoidFunction` helpers.
// TODO(B3): Take the JSX props from the package's `jsx.d.ts` once it ships one.
import 'react';

declare module 'react' {
  // The type parameter must match React's declaration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    // Optimization for DOM nodes prepends and inserts
    teactFastList?: boolean;
    // Gone from Teact (inputs with `value` or `checked` are always controlled), still set by TestControlledInput.tsx
    teactExperimentControlled?: boolean;
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

declare global {
  type NoneToVoidFunction = () => void;

  type Complete<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
  };
}
