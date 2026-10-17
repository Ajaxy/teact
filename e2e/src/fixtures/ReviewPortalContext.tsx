// Regression fixture from the review of Ajaxy/teact#7 (oss-plan evidence): a context consumer inside a Portal
import { createContext } from '@teact/core';

import useContext from '../../stubs/hooks/data/useContext';

import Portal from '../../stubs/components/ui/Portal';

const Context = createContext('default');

const Consumer = ({ id }: { id: string }) => {
  const value = useContext(Context);

  return <div id={id}>{`${id}: ${value}`}</div>;
};

const ReviewPortalContext = () => (
  <Context.Provider value="provided">
    <Consumer id="inline" />
    <Portal>
      <Consumer id="portaled" />
    </Portal>
  </Context.Provider>
);

export default ReviewPortalContext;
