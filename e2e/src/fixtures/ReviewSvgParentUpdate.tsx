// Regression fixture: SVG children of a component and of a
// fragment, updated by their parent
import { useState } from '@teact/core';

function Child({ isOn }: { isOn: boolean }) {
  return (
    <>
      {isOn && <circle data-testid="child-circle" cx="20" cy="20" r="5" fill="black" />}
      <rect data-testid="child-rect" x="0" y="40" width="20" height="20" fill={isOn ? 'red' : 'green'} />
    </>
  );
}

function ReviewSvgParentUpdate() {
  const [isOn, setIsOn] = useState(false);

  return (
    <div>
      <button id="toggle-svg" onClick={() => setIsOn(!isOn)}>toggle</button>
      <svg width="100" height="100">
        <Child isOn={isOn} />
        <>
          {isOn && <circle data-testid="fragment-circle" cx="60" cy="20" r="5" fill="black" />}
          <rect data-testid="fragment-rect" x="50" y="40" width="20" height="20" fill={isOn ? 'red' : 'green'} />
        </>
      </svg>
    </div>
  );
}

export default ReviewSvgParentUpdate;
