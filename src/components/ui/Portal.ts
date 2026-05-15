import type { FC, VirtualElement } from '../../teact/teact';
import { useLayoutEffect, useRef } from '../../teact/teact';
import TeactDOM from '../../teact/teact-dom';

type OwnProps = {
  containerSelector?: string;
  className?: string;
  children: VirtualElement;
};

const Portal: FC<OwnProps> = ({ containerSelector, className, children }) => {
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  useLayoutEffect(() => {
    const container = document.querySelector<HTMLDivElement>(containerSelector || '#portals');
    if (!container) {
      return undefined;
    }

    const element = elementRef.current;
    if (className) {
      element.classList.add(className);
    }

    container.appendChild(element);

    TeactDOM.render(children, element);

    return () => {
      TeactDOM.render(undefined, element);
      container.removeChild(element);
    };
  }, [className, containerSelector, children]);

  return null;
};

export default Portal;
