// Types that Web A's test components use without importing them, as declared in Web A's `src/@types/global.d.ts`.
// The Teact JSX props come from the package's jsx.d.ts; this adds the ones that only Web A declares, and the
// `Complete` and `NoneToVoidFunction` helpers.
import 'react';

declare module 'react' {
  // The type parameter must match React's declaration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    // Gone from Teact (inputs with `value` or `checked` are always controlled), still set by TestControlledInput.tsx
    teactExperimentControlled?: boolean;
  }
}

declare global {
  type NoneToVoidFunction = () => void;

  type Complete<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
  };
}
