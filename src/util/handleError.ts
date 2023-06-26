window.addEventListener('error', handleErrorEvent);
window.addEventListener('unhandledrejection', handleErrorEvent);

function handleErrorEvent(e: ErrorEvent | PromiseRejectionEvent) {
  // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  if (e instanceof ErrorEvent && e.message === 'ResizeObserver loop limit exceeded') {
    return;
  }

  e.preventDefault();

  handleError(e instanceof ErrorEvent ? (e.error || e.message) : e.reason);
}

export function handleError(err: Error) {
  // eslint-disable-next-line no-console
  console.error(err);
}
