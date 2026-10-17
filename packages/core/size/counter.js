// size-limit fixture: a counter, the smallest real app (a component with state, rendered into the page), built against
// the production build
import { render } from '../dist/dom.js';
import { createElement, useState } from '../dist/index.js';

function Counter() {
  const [count, setCount] = useState(0);

  return createElement('button', { type: 'button', onClick: () => setCount(count + 1) }, `Clicked ${count} times`);
}

render(createElement(Counter, {}), document.getElementById('root'));
