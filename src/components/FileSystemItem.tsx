import React, { memo } from 'react';
import {
  Folder,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  FileCog,
  FileLock,
  Terminal as TerminalIcon,
  ChevronRight,
  Scissors,
  Copy,
  PackageOpen,
} from 'lucide-react';
import { FileNode, Linemode } from '../types';
import { BASE_TIME } from '../constants/timings';

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
}

const getFileStyle = (node: FileNode) => {
  if (node.type === 'dir') return { color: 'text-cyan-400', icon: Folder };
  if (node.type === 'archive') return { color: 'text-red-400', icon: PackageOpen };

  const name = node.name.toLowerCase();

  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) {
    return { color: 'text-purple-400', icon: FileImage };
  }
  if (/\.(exe|bin|sh|bat)$/.test(name)) {
    return { color: 'text-green-400', icon: TerminalIcon };
  }
  if (/\.(zip|tar|gz|7z|rar)$/.test(name)) {
    return { color: 'text-red-400', icon: FileArchive };
  }
  if (/\.(json|toml|yaml|conf|ini|xml)$/.test(name)) {
    return { color: 'text-cyan-400', icon: FileCog };
  }
  if (/\.(js|ts|tsx|py|rs|c|cpp|go|java)$/.test(name)) {
    return { color: 'text-yellow-400', icon: FileCode };
  }
  if (/\.(pem|key|lock)$/.test(name)) {
    return { color: 'text-amber-600', icon: FileLock };
  }
  if (/\.(md|txt)$/.test(name)) {
    return { color: 'text-zinc-300', icon: FileText };
  }

  return { color: 'text-zinc-400', icon: FileText };
};

const formatSize = (node: FileNode) => {
  if (node.type === 'dir' || node.type === 'archive') {
    const count = node.children?.length || 0;
    return `${count}`;
  }
  const bytes = node.content?.length || 0;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

const getFakeDate = (node: FileNode) => {
  // Use actual modifiedAt if available, otherwise fallback to stable fake date
  if (node.modifiedAt) {
    const date = new Date(node.modifiedAt);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Fallback: Generate stable date from hash
  let hash = 0;
  for (let i = 0; i < node.id.length; i++) {
    hash = (hash << 5) - hash + node.id.charCodeAt(i);
    hash |= 0;
  }
  // Keep undated files on the same historical clock as the rest of the simulation.
  const baseTime = BASE_TIME;
  const offset = Math.abs(hash) % (30 * 24 * 60 * 60 * 1000);
  const date = new Date(baseTime - offset);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getPermissions = (node: FileNode) => {
  return node.type === 'dir' || node.type === 'archive' ? 'drwxr-xr-x' : '-rw-r--r--';
};

const getListItemRowClasses = (
  isActive: boolean,
  isCursor: boolean,
  isMarked: boolean,
  isParent: boolean,
  isCut: boolean,
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

  const baseClasses = `px-3 py-0.5 flex items-center gap-2 truncate font-mono cursor-default text-sm transition-colors duration-75 relative`;

  return `
    ${baseClasses}
    ${rowBg}
    ${isMarked ? 'text-yellow-400' : rowText}
    ${isParent && !isCursor ? 'opacity-70' : ''}
    ${isCut ? 'opacity-50' : ''}
  `;
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
}) => {
  const { color, icon: Icon } = getFileStyle(item);

  let rowTextClass = '';
  if (isCursor) {
    if (isActive) {
      if (!isMarked) rowTextClass = 'text-white font-medium';
    } else {
      if (!isMarked) rowTextClass = 'text-zinc-400';
    }
  }

  return (
    <React.Fragment>
      <div
        id={optionId}
        role={isParent ? 'listitem' : 'option'}
        aria-selected={isParent ? undefined : isMarked}
        data-testid={`file-${item.name}`}
        aria-current={isCursor ? 'location' : undefined}
        aria-label={`${item.name}, ${item.type}`}
        className={getListItemRowClasses(
          isActive,
          isCursor,
          isMarked,
          isParent,
          isCut,
          rowTextClass
        )}
      >
        <span className={`${isMarked ? 'text-yellow-500' : color} shrink-0`} aria-hidden="true">
          <Icon
            size={14}
            fill={item.type === 'dir' ? 'currentColor' : 'none'}
            fillOpacity={item.type === 'dir' ? 0.2 : 0}
          />
        </span>

        <span className={`truncate flex-1 flex items-center gap-2 ${isMarked ? 'font-bold' : ''}`}>
          <span className={`${isCut ? 'line-through decoration-red-500/50' : ''}`}>
            {item.displayPath || item.name}
          </span>
        </span>

        {linemode !== 'none' && !isGrid && (
          <span
            className={`text-xs w-24 text-right font-mono tabular-nums shrink-0 hidden sm:block ${isCursor || isParent ? 'text-zinc-300' : 'text-zinc-400'}`}
          >
            {linemode === 'size' && formatSize(item)}
            {linemode === 'mtime' && getFakeDate(item)}
            {linemode === 'permissions' && getPermissions(item)}
          </span>
        )}

        <div className="flex items-center gap-2 min-w-[20px] justify-end">
          {isCut && <Scissors size={10} className="text-red-500 animate-pulse" />}
          {isYank && <Copy size={10} className="text-blue-400" />}
          {isMarked && (
            <span className="text-yellow-500 text-xs font-bold tracking-tighter">[VIS]</span>
          )}
        </div>

        {item.type === 'dir' && !isGrid && (
          <span className="text-zinc-700 shrink-0">
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
    prev.isGrid === next.isGrid
  );
});
