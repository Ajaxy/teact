// Regression fixture: context consumers keep updating after a
// sibling consumer unmounts
import { createContext, memo, useState } from '@teact/core';

import useContext from '../../stubs/hooks/data/useContext';

const Context = createContext('initial');

const Consumer = memo(({ id }: { id: string }) => {
  const value = useContext(Context);

  return <div id={id}>{`${id}: ${value}`}</div>;
});

function ReviewContextUnmount() {
  const [value, setValue] = useState('v0');
  const [isAShown, setIsAShown] = useState(true);

  return (
    <div>
      <button id="hide-a" onClick={() => setIsAShown(false)}>hide A</button>
      <button id="change" onClick={() => setValue(`v${Number(value.slice(1)) + 1}`)}>change</button>
      <Context.Provider value={value}>
        {isAShown ? <Consumer id="a" /> : undefined}
        <Consumer id="b" />
      </Context.Provider>
    </div>
  );
}

export default ReviewContextUnmount;
