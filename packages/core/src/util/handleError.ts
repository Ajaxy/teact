// Temporary boundary shim for Web A's `src/util/handleError.ts`: logs to the console and installs no window listeners.
// TODO(B3): Replace with `errors.ts` and `configureTeact({ onError })`.
export function handleError(err: Error) {
  // eslint-disable-next-line no-console
  console.error(err);
}
