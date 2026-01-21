import React, { useEffect, useRef, memo, useMemo } from 'react';
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
}

export const FileSystemPane: React.FC<FileSystemPaneProps> = ({
  items,
  isActive,
  cursorIndex = -1,
  isParent = false,
  selectedIds = [],
  clipboard,
  linemode,
  className,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && cursorIndex >= 0) {
      const children = listRef.current.children;
      if (children[cursorIndex]) {
        children[cursorIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [cursorIndex]);

  const defaultWidth = isParent ? 'w-1/3' : 'flex-1';
  const bgColors = isParent ? 'bg-zinc-950/50 text-zinc-400' : 'bg-zinc-900/80 text-zinc-300';

  // Use className directly if it contains grid layout classes, otherwise append default bg/width
  const isGrid = !!className?.includes('grid');
  const finalClass = isGrid ? className : `${defaultWidth} ${bgColors} ${className || ''}`;

  // Pre-compute clipboard set for O(1) lookups
  const clipboardSet = useMemo(() => new Set(clipboard?.nodes?.map((n) => n.id)), [clipboard]);

  // Pre-compute selected IDs set for O(1) lookups
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div
      data-testid={`filesystem-pane-${isActive ? 'active' : 'inactive'}`}
      className={`flex flex-col h-full border-r border-zinc-800 transition-colors duration-300 ${finalClass}`}
    >
      <div
        ref={listRef}
        role="list"
        aria-label="File Browser"
        className={`flex-1 overflow-y-auto py-1 scrollbar-hide relative ${isGrid ? className : ''}`}
      >
        {items.length === 0 && (
          <div
            className="absolute top-10 w-full text-center text-zinc-600 font-mono text-sm select-none"
            role="status"
          >
            No items
          </div>
        )}
        {items.map((item, idx) => {
          const isCursor = idx === cursorIndex;
          const isMarked = selectedIdsSet.has(item.id);

          const inClipboard = clipboardSet.has(item.id);
          const isCut = !!(inClipboard && clipboard?.action === 'cut');
          const isYank = !!(inClipboard && clipboard?.action === 'yank');

          return (
            <MemoizedFileSystemItem
              key={item.id}
              item={item}
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
    </div>
  );
};

export const MemoizedFileSystemPane = memo(FileSystemPane);
