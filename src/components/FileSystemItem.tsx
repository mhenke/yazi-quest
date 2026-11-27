import React, { memo } from 'react';
import { ChevronRight, Scissors, Copy } from 'lucide-react';
import { FileNode, Linemode } from '../types';
import { computeNodeBytes, formatBytes, getDeterministicTimestamp } from '../utils/sizeHelpers';
import { getFileStyle as resolveFileStyle } from './fileIcon';

interface FileSystemItemProps {
  item: FileNode;
  optionId?: string;
  isActive: boolean;
  isCursor: boolean;
  isMarked: boolean;
  isParent: boolean;
  isCut: boolean;
  isYank: boolean;
  linemode: Linemode;
  isGrid: boolean;
  dirCount: number | null;
}

const getFileStyle = (node: FileNode) => resolveFileStyle(node, true);

const formatSize = (node: FileNode, dirCount: number | null) => {
  if (node.type === 'dir') {
    // A directory's count is null until its folder has been loaded (tab cache).
    return dirCount === null ? '' : `${dirCount}`;
  }
  return formatBytes(computeNodeBytes(node));
};

const getFakeDate = (node: FileNode) => {
  const date = new Date(getDeterministicTimestamp(node));
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getPermissions = (node: FileNode) => {
  if (node.permissions) return node.permissions;
  return node.type === 'dir' || node.type === 'archive' ? 'drwxr-xr-x' : '-rw-r--r--';
};

const getListItemRowClasses = (
  isActive: boolean,
  isCursor: boolean,
  isMarked: boolean,
  isParent: boolean,
  rowText: string
): string => {
  let rowBg = '';

  if (isCursor) {
    if (isActive) {
      rowBg = 'bg-zinc-800';
    } else {
      rowBg = 'bg-zinc-800/40';
    }
  }

  const baseClasses = `px-3 py-0.5 flex items-center gap-2 truncate font-mono cursor-default text-sm transition-colors duration-75`;

  return `
    ${baseClasses}
    ${rowBg}
    ${isMarked ? 'text-yellow-400' : rowText}
    ${isParent && !isCursor ? 'text-zinc-400' : ''}
  `;
};

const resolveRowTextClass = (
  isCut: boolean,
  isMarked: boolean,
  isCursor: boolean,
  isActive: boolean
): string => {
  if (isMarked) return '';
  if (isCut) return 'text-zinc-400';
  if (!isCursor) return '';
  return isActive ? 'text-white font-medium' : 'text-zinc-400';
};

const FileSystemItem: React.FC<FileSystemItemProps> = ({
  item,
  optionId,
  isActive,
  isCursor,
  isMarked,
  isParent,
  isCut,
  isYank,
  linemode,
  isGrid,
  dirCount,
}) => {
  const { color, icon: Icon } = getFileStyle(item);
  const rowTextClass = resolveRowTextClass(isCut, isMarked, isCursor, isActive);

  return (
    <React.Fragment>
      <div
        id={optionId}
        role={isParent ? 'listitem' : 'option'}
        aria-selected={isParent ? undefined : isMarked}
        data-testid={`file-${item.name}`}
        aria-current={isCursor ? 'location' : undefined}
        aria-label={`${item.name}, ${item.type}`}
        className={getListItemRowClasses(isActive, isCursor, isMarked, isParent, rowTextClass)}
      >
        <span className={`${isMarked ? 'text-yellow-500' : color} shrink-0`} aria-hidden="true">
          <Icon
            size={14}
            fill={item.type === 'dir' ? 'currentColor' : 'none'}
            fillOpacity={item.type === 'dir' ? 0.2 : 0}
          />
        </span>

        <span className={`truncate flex-1 flex items-center gap-2 ${isMarked ? 'font-bold' : ''}`}>
          <span className={`${isCut ? 'line-through decoration-red-400' : ''}`}>
            {item.displayPath || item.name}
          </span>
        </span>

        {linemode !== 'none' && !isGrid && !isParent && (
          <span
            className={`text-xs w-24 text-right font-mono tabular-nums shrink-0 hidden sm:block ${isCursor ? 'text-zinc-300' : 'text-zinc-400'}`}
          >
            {linemode === 'size' && formatSize(item, dirCount)}
            {linemode === 'mtime' && getFakeDate(item)}
            {linemode === 'permissions' && getPermissions(item)}
          </span>
        )}

        <div className="flex items-center gap-2 min-w-[20px] justify-end">
          {isCut && <Scissors size={12} className="text-red-400" aria-hidden="true" />}
          {isYank && <Copy size={10} className="text-blue-400" aria-hidden="true" />}
          {isMarked && (
            <span className="text-yellow-500 text-xs font-bold tracking-tighter">[VIS]</span>
          )}
        </div>

        {item.type === 'dir' && !isGrid && (
          <span className="text-zinc-700 shrink-0" aria-hidden="true">
            <ChevronRight size={12} strokeWidth={3} />
          </span>
        )}
      </div>
    </React.Fragment>
  );
};

export const MemoizedFileSystemItem = memo(FileSystemItem, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.optionId === next.optionId &&
    prev.isActive === next.isActive &&
    prev.isCursor === next.isCursor &&
    prev.isMarked === next.isMarked &&
    prev.isParent === next.isParent &&
    prev.isCut === next.isCut &&
    prev.isYank === next.isYank &&
    prev.linemode === next.linemode &&
    prev.isGrid === next.isGrid &&
    prev.dirCount === next.dirCount
  );
});
