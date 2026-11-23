import React, { useEffect, useId, useRef, memo, useMemo } from 'react';
import { FileNode, ClipboardItem, Linemode } from '../types';
import { MemoizedFileSystemItem } from './FileSystemItem';

interface FileSystemPaneProps {
  items: FileNode[];
  isActive: boolean;
  cursorIndex?: number;
  isParent?: boolean;
  selectedIds: string[];
  clipboard: ClipboardItem | null;
  linemode: Linemode;
  className?: string;
  focusRef?: React.RefObject<HTMLDivElement | null>;
}

const FileSystemPane: React.FC<FileSystemPaneProps> = ({
  items,
  isActive,
  cursorIndex = -1,
  isParent = false,
  selectedIds = [],
  clipboard,
  linemode,
  className,
  focusRef,
}) => {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const listRef = focusRef ?? fallbackRef;
  const listId = useId();

  useEffect(() => {
    if (listRef.current && cursorIndex >= 0) {
      const children = listRef.current.children;
      if (children[cursorIndex]) {
        children[cursorIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [cursorIndex, items, listRef]);

  const defaultWidth = isParent ? 'w-1/3' : 'flex-1';
  const bgColors = isParent ? 'bg-zinc-950/50 text-zinc-400' : 'bg-zinc-900/80 text-zinc-300';

  // Use className directly if it contains grid layout classes, otherwise append default bg/width
  const isGrid = !!className?.includes('grid');
  const finalClass = isGrid ? className : `${defaultWidth} ${bgColors} ${className || ''}`;

  const clipboardSet = useMemo(() => new Set(clipboard?.nodes?.map((n) => n.id)), [clipboard]);
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div
      data-testid={`filesystem-pane-${isActive ? 'active' : 'inactive'}`}
      className={`relative flex flex-col h-full border-r border-zinc-800 transition-colors duration-300 ${finalClass}`}
    >
      <div
        ref={listRef}
        {...(isParent
          ? { role: 'list', 'aria-label': 'Parent folder' }
          : {
              role: 'listbox',
              tabIndex: isActive ? 0 : -1,
              'aria-label': 'File Browser',
              'aria-multiselectable': true,
              'aria-activedescendant': items[cursorIndex] ? `${listId}-${cursorIndex}` : undefined,
              'aria-description':
                'Use Tab to inspect the current item or Shift+Tab for the toolbar.',
            })}
        className={`flex-1 overflow-y-auto py-1 scrollbar-hide relative focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400 ${isGrid ? className : ''}`}
      >
        {items.map((item, idx) => {
          const isCursor = idx === cursorIndex;
          const isMarked = selectedIdsSet.has(item.id);

          const inClipboard = clipboardSet.has(item.id);
          const isCut = !!(inClipboard && clipboard?.action === 'cut');
          const isYank = !!(inClipboard && clipboard?.action === 'yank');

          return (
            <MemoizedFileSystemItem
              key={`${item.id}-${isParent ? 'parent' : 'active'}`}
              item={item}
              optionId={isParent ? undefined : `${listId}-${idx}`}
              isActive={isActive}
              isCursor={isCursor}
              isMarked={isMarked}
              isParent={isParent}
              isCut={isCut}
              isYank={isYank}
              linemode={linemode}
              isGrid={isGrid}
            />
          );
        })}
      </div>
      {items.length === 0 && (
        <div
          className="absolute top-10 w-full text-center text-zinc-400 font-mono text-sm pointer-events-none select-none"
          role="status"
        >
          No items
        </div>
      )}
    </div>
  );
};

export const MemoizedFileSystemPane = memo(FileSystemPane);
