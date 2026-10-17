// Helper types that Web A and MyTonWallet declare globally in their src/@types/global.d.ts. The package imports them
// from here, so that its declarations do not rely on an app's global types.

export type AnyLiteral = Record<string, any>;
export type AnyFunction = (...args: any[]) => any;
export type AnyToVoidFunction = (...args: any[]) => void;
export type NoneToVoidFunction = () => void;
