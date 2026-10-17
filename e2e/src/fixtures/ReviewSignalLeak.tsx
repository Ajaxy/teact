// Regression fixture: the consumer follows the signal through an effect dependency (Teact subscribes to signals in
// `useEffect` dependencies)
import {
  createSignal, type Signal, useEffect, useState,
} from '@teact/core';

const [getCountSignal, setCount] = createSignal(0);

declare global {
  interface Window {
    resolverCalls: number;
  }
}

window.resolverCalls = 0;

function Consumer({ getCount }: { getCount: Signal<number> }) {
  const [value, setValue] = useState(() => getCount());

  useEffect(() => {
    window.resolverCalls++;
    setValue(getCount());
  }, [getCount]);

  return <div id="consumer">{`value: ${value}`}</div>;
}

function ReviewSignalLeak() {
  const [isShown, setIsShown] = useState(true);

  return (
    <div>
      <button id="toggle-consumer" onClick={() => setIsShown(!isShown)}>toggle</button>
      <button id="inc" onClick={() => setCount(getCountSignal() + 1)}>inc</button>
      {isShown && <Consumer getCount={getCountSignal} />}
    </div>
  );
}

export default ReviewSignalLeak;
