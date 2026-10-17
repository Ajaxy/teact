// Regression fixture from the review of Ajaxy/teact#7 (oss-plan evidence): Portal content keeps its state when the
// component around the Portal re-renders
import { useState } from '@teact/core';

import Portal from '../../stubs/components/ui/Portal';

const PortalCounter = () => {
  const [value, setValue] = useState(0);

  return <button id="portal-inc" onClick={() => setValue(value + 1)}>{`portal: ${value}`}</button>;
};

const ReviewPortalState = () => {
  const [value, setValue] = useState(0);

  return (
    <div>
      <button id="main-inc" onClick={() => setValue(value + 1)}>{`main: ${value}`}</button>
      <Portal>
        <div id="portal-content">
          <PortalCounter />
        </div>
      </Portal>
    </div>
  );
};

export default ReviewPortalState;
