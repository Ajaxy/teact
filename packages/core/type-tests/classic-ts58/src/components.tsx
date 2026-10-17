// Components as MyTonWallet writes them: `import React` for the classic runtime, Teact refs, string styles and the
// Teact JSX props, which come from the package's jsx.d.ts
import React, {
  createContext, type ElementRef, type FC, memo, type TeactNode, useCallback, useContextSignal, useEffect,
  useLayoutEffect, useMemo, useRef, useSignal, useState, useUnmountCleanup,
} from '@teact/core';
import TeactDOM, { addExtraClass, removeExtraClass, setExtraStyles, toggleExtraClass } from '@teact/core/dom';

type OwnProps = {
  items: { id: string; order: number; label: string }[];
  stream?: MediaStream;
  onSelect?: (id: string) => void;
};

const ThemeContext = createContext('light');

// Returns what `render()` returns, like Web A's and MyTonWallet's `Portal`: it must type-check as a JSX component (H16)
const Portal = ({ children }: { children: TeactNode }) => {
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  return TeactDOM.render(children as Parameters<typeof TeactDOM.render>[0], elementRef.current);
};

const List: FC<OwnProps> = ({ items, stream, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string>();
  const listRef = useRef<HTMLUListElement>();
  const videoRef: ElementRef<HTMLVideoElement> = useRef();
  const getTheme = useContextSignal(ThemeContext);
  const [getHoverX, setHoverX] = useSignal(0);
  const sorted = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  const handleClick = useCallback((id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  }, [onSelect]);

  useLayoutEffect(() => {
    if (listRef.current) addExtraClass(listRef.current, 'measured');
  }, []);

  useEffect(() => {
    const list = listRef.current!;
    toggleExtraClass(list, 'selected', Boolean(selectedId));
    setExtraStyles(list, { '--hover-x': `${getHoverX()}px` });

    return () => removeExtraClass(list, 'measured');
  }, [selectedId, getHoverX]);

  useUnmountCleanup(() => {
    setHoverX(0);
  });

  return (
    <>
      <ul ref={listRef} teactFastList className={getTheme()} style="list-style: none">
        {sorted.map(({ id, order, label }) => (
          <li
            key={id}
            teactOrderKey={order}
            onClick={() => handleClick(id)}
            onMouseMove={(e) => setHoverX(e.offsetX + e.offsetY)}
          >
            {label}
          </li>
        ))}
      </ul>
      <input onKeyDown={(e) => !e.isComposing && e.key === 'Enter'} value={selectedId} />
      <div ref={(element) => element?.focus()} />
      <video ref={videoRef} srcObject={stream} defaultMuted />
      <Portal>
        <span>{selectedId}</span>
      </Portal>
    </>
  );
};

export default memo(List);

export function mount(root: HTMLElement) {
  TeactDOM.render(
    <ThemeContext.Provider value="dark">
      <List items={[]} />
    </ThemeContext.Provider>,
    root,
  );
}
