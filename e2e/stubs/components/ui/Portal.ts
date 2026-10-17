// Stand-in for Web A's src/components/ui/Portal.ts: renders its children into a separate Teact root that is attached
// to `containerSelector` (`#portals` by default)
import { type TeactNode, useLayoutEffect, useRef } from '@teact/core';
import TeactDOM from '@teact/core/dom';

type OwnProps = {
  containerSelector?: string;
  children: TeactNode;
};

const Portal = ({ containerSelector, children }: OwnProps) => {
  // eslint-disable-next-line @eslint-react/purity
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector || '#portals');
    if (!container) {
      return undefined;
    }

    const element = elementRef.current;
    container.appendChild(element);

    return () => {
      TeactDOM.render(undefined, element);
      element.remove();
    };
  }, [containerSelector]);

  return TeactDOM.render(children as Parameters<typeof TeactDOM.render>[0], elementRef.current);
};

export default Portal;
