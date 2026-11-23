import { useEffect, type RefObject } from 'react';

export const useScrollToCursor = (
  listRef: RefObject<HTMLDivElement | null>,
  cursorIndex: number,
  items: readonly unknown[]
) => {
  useEffect(() => {
    if (!listRef.current || cursorIndex < 0) return;
    listRef.current.children[cursorIndex]?.scrollIntoView({ block: 'nearest' });
  }, [cursorIndex, items, listRef]);
};
