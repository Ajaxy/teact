import TeactDOM from '@teact/core/dom';

import { flushFrames } from './frames';

type Renderable = Parameters<typeof TeactDOM.render>[0];

const containers = new Set<HTMLElement>();

export function createContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.add(container);

  return container;
}

/** Renders into a new container attached to `document.body` (or re-renders into `container`) */
export function mount(element: Renderable, container = createContainer()) {
  TeactDOM.render(element, container);

  return container;
}

/** Unmounts everything that `mount()` rendered, removes the containers and runs the frames this schedules */
export async function unmountAll() {
  containers.forEach((container) => {
    TeactDOM.render(undefined, container);
    container.remove();
  });
  containers.clear();

  await flushFrames();
}
