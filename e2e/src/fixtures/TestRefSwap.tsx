// Ported from Ajaxy/teact#6 by @muhin-g-s (demo/tests/TestUpdateRef.tsx), renamed: TestUpdateRef here is Web A's
// original. Changes: the empty ref is `undefined` (Teact style), and an effect logs what the ref points to.
import { useEffect, useRef, useState } from '@teact/core';

const INTERACTIVE = 'cursor: pointer; text-decoration: underline;';

const TestRefSwap = () => {
  const [showFirst, setShowFirst] = useState(true);
  const ref = useRef<HTMLSpanElement>();

  function handleClick() {
    setShowFirst(!showFirst);
  }

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('ref', ref.current?.textContent);
  }, [showFirst]);

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
      <div>
        Current:
        {' '}
        {showFirst ? 'First' : 'Second'}
      </div>
    </>
  );
};

export default TestRefSwap;
