import { useCallback, useState } from '../teact/teact';

const useForceUpdate = () => {
  const [, setTrigger] = useState<boolean>(false);

  return useCallback(() => {
    setTrigger((trigger) => !trigger);
  }, []);
};

export default useForceUpdate;
