// `@teact/core/dom`: rendering into the DOM and helpers for classes and styles set outside of Teact.

import TeactDOM from './lib/teact/teact-dom';

export default TeactDOM;
export {
  addExtraClass,
  removeExtraClass,
  toggleExtraClass,
  setExtraStyles,
} from './lib/teact/teact-dom';

// TODO(B3): Export `render` from teact-dom.ts itself and declare its return type as `undefined`.
export const { render } = TeactDOM;
