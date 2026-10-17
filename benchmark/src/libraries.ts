import { createElement as createReactElement, useState as useReactState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot as createReactRoot } from 'react-dom/client';
import { createElement as createTeactElement, useState as useTeactState } from '@teact/core';
import { render as renderTeact } from '@teact/core/dom';
import { createElement as createPreactElement, render as renderPreact } from 'preact';
import { useState as usePreactState } from 'preact/hooks';

declare const __LIBRARY_VERSIONS__: Record<LibraryId, string>;

export type LibraryId = 'teact' | 'react' | 'preact';

// Each library's `createElement`, typed loosely so that one benchmark source builds elements for all of them
export type CreateElement = (type: any, props?: Record<string, unknown> | null, ...children: unknown[]) => unknown;
export type UseState = <T>(initial: T) => [T, (value: T) => void];

export interface BenchmarkRoot {
  /** Renders an element into the container synchronously */
  render(element: unknown): void;
  /** Removes what `render` rendered, leaving the root reusable */
  clear(): void;
  unmount(): void;
}

export interface Library {
  id: LibraryId;
  name: string;
  version: string;
  createElement: CreateElement;
  useState: UseState;
  createRoot(container: HTMLElement): BenchmarkRoot;
}

export const LIBRARIES: Library[] = [
  {
    id: 'teact',
    name: 'Teact',
    version: __LIBRARY_VERSIONS__.teact,
    createElement: createTeactElement as CreateElement,
    useState: useTeactState,
    createRoot: (container) => ({
      render: (element) => renderTeact(element as Parameters<typeof renderTeact>[0], container),
      clear: () => renderTeact(undefined, container),
      unmount: () => renderTeact(undefined, container),
    }),
  },
  {
    id: 'react',
    name: 'React',
    version: __LIBRARY_VERSIONS__.react,
    createElement: createReactElement as CreateElement,
    useState: useReactState,
    createRoot: (container) => {
      const root = createReactRoot(container);

      // React 19 renders asynchronously; `flushSync` makes it render before returning, as the others do
      /* eslint-disable @eslint-react/dom-no-flush-sync */
      return {
        render: (element) => flushSync(() => root.render(element as Parameters<typeof root.render>[0])),
        // eslint-disable-next-line no-null/no-null
        clear: () => flushSync(() => root.render(null)),
        unmount: () => root.unmount(),
      };
      /* eslint-enable @eslint-react/dom-no-flush-sync */
    },
  },
  {
    id: 'preact',
    name: 'Preact',
    version: __LIBRARY_VERSIONS__.preact,
    createElement: createPreactElement as CreateElement,
    useState: usePreactState,
    createRoot: (container) => ({
      render: (element) => renderPreact(element as Parameters<typeof renderPreact>[0], container),
      // eslint-disable-next-line no-null/no-null
      clear: () => renderPreact(null, container),
      // eslint-disable-next-line no-null/no-null
      unmount: () => renderPreact(null, container),
    }),
  },
];
