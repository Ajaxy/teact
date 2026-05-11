import React, { useState } from '../src/teact/teact';
import TeactDOM from '../src/teact/teact-dom';

import TestFragment from './tests/TestFragment';

type TestName = 'TestFragment';

const TESTS: Record<TestName, () => JSX.Element> = {
  TestFragment,
};

TeactDOM.render(
  <App />,
  document.getElementById('root')!,
);

function App() {
  const [active, setActive] = useState<TestName | null>(null);

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
        {(Object.keys(TESTS) as TestName[]).map((name) => (
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
