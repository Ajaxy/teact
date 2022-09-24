window.addEventListener('error', handleErrorEvent);
window.addEventListener('unhandledrejection', handleErrorEvent);

function handleErrorEvent(e: ErrorEvent | PromiseRejectionEvent) {
  e.preventDefault();

  handleError(e instanceof ErrorEvent ? e.error : e.reason);
}

export function handleError(err: Error) {
  // eslint-disable-next-line no-console
  console.error(err);
}
