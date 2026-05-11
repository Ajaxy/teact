import React, { useRef, useState } from '../../src/teact/teact';

const INTERACTIVE = 'cursor: pointer; text-decoration: underline;';

const TestUpdateRef = () => {
  const [showFirst, setShowFirst] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);

  function handleClick() {
    setShowFirst(!showFirst);
  }

  return (
    <>
      <div>
        {showFirst ? (
          <span ref={ref} onClick={handleClick} style={INTERACTIVE}>
            First
          </span>
        ) : (
          <span ref={ref} onClick={handleClick} style={INTERACTIVE}>
            Second
          </span>
        )}
      </div>
      <div>Current: {showFirst ? 'First' : 'Second'}</div>
    </>
  );
};

export default TestUpdateRef;
