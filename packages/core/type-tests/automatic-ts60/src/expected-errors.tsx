// What the package does not allow
import { configureTeact } from '@teact/core';
// @ts-expect-error `cloneElement` is internal (`@teact/core/internal`)
import { cloneElement } from '@teact/core';
import { render } from '@teact/core/dom';

void cloneElement;

// @ts-expect-error `render()` returns `undefined`
export const size: number = render(<div />, document.body);

// @ts-expect-error Gone from Teact: inputs with `value` or `checked` are always controlled
export const input = <input value="a" teactExperimentControlled />;

// @ts-expect-error `teactFastList` is a boolean
export const list = <ul teactFastList="yes" />;

// @ts-expect-error `onError` receives an `Error`
configureTeact({ onError: (error: number) => void error });
