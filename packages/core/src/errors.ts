// Runtime configuration and error reporting. Teact catches the errors thrown by component renders, effects and their
// cleanups, fasterdom tasks, after-render callbacks and TeactN mappers, and reports them here. It never installs
// global error listeners: errors that it does not catch, such as those thrown by event handlers, TeactN action
// handlers and TeactN `addCallback` callbacks, reach the caller and the app's own handlers, as they do in Web A.

export interface TeactConfig {
  /**
   * Receives the errors that Teact catches. A thrown value that is not an `Error` is wrapped as
   * `new Error(String(value), { cause: value })`. Defaults to `console.error`.
   */
  // Method syntax, so that a handler with a narrower parameter type, such as `(err: Error | string) => void`, fits
  onError?(error: Error): void;
}

let currentConfig: TeactConfig = {};

/** Sets runtime options. Options left out keep their current values; set one to `undefined` to restore its default */
export function configureTeact(config: TeactConfig) {
  currentConfig = { ...currentConfig, ...config };
}

export function reportError(thrown: unknown) {
  const error = toError(thrown);
  const { onError } = currentConfig;

  if (!onError) {
    // eslint-disable-next-line no-console
    console.error(error);
    return;
  }

  try {
    onError(error);
  } catch (handlerError) {
    // A failing handler must not break the update pass that caught the error
    // eslint-disable-next-line no-console
    console.error(handlerError, error);
  }
}

function toError(thrown: unknown) {
  if (thrown instanceof Error) {
    return thrown;
  }

  let message: string;
  try {
    message = String(thrown);
  } catch {
    // Objects without a usable `toString`, such as `Object.create(null)`
    message = 'Non-error value thrown';
  }

  return new Error(message, { cause: thrown });
}
