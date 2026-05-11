import React, { useState } from '../src/teact/teact';
import TeactDOM from '../src/teact/teact-dom';

import TestFragment from './tests/TestFragment';
import TestFragment2 from './tests/TestFragment2';
import TestSetContent from './tests/TestSetContent';
import TestNoContainer from './tests/TestNoContainer';

const TESTS: Record<string, () => JSX.Element> = {
  TestFragment,
  TestFragment2,
  TestSetContent,
  TestNoContainer,
};

TeactDOM.render(
  <App />,
  document.getElementById('root')!,
);

function App() {
  const [active, setActive] = useState<string | null>(null);

  if (active !== null) {
    const TestComponent = TESTS[active];
    return (
      <div>
        <div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActive(null);
            }}
          >
            ← Back to list
          </a>
        </div>
        <h2>{active}</h2>
        <TestComponent />
      </div>
    );
  }

  return (
    <div>
      <h2>Teact Test Harness</h2>
      <ul>
        {Object.keys(TESTS).map((name) => (
          <li key={name}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActive(name);
              }}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
