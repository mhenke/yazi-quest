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

interface RenameState {
  isRenaming: boolean;
  inputBuffer: string;
}

interface FileSystemItemProps {
  item: FileNode;
  isActive: boolean;
  isCursor: boolean;
  isMarked: boolean;
  isParent: boolean;
  isCut: boolean;
  isYank: boolean;
  linemode: Linemode;
  isGrid: boolean;
  renameState?: RenameState;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}

const getFileStyle = (node: FileNode) => {
  if (node.type === 'dir') return { color: 'text-blue-400', icon: Folder };
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
  // Use a fixed base time (Jan 1, 2024) instead of Date.now() for stability
  const baseTime = 1704067200000;
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
  rowText: string,
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
    ${isParent && !isCursor ? 'opacity-50 grayscale' : ''}
    ${isCut ? 'opacity-50' : ''}
  `;
};

const FileSystemItem: React.FC<FileSystemItemProps> = ({
  item,
  isActive,
  isCursor,
  isMarked,
  isParent,
  isCut,
  isYank,
  linemode,
  isGrid,
  renameState,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const { color, icon: Icon } = getFileStyle(item);
  const showRename = isActive && isCursor && renameState?.isRenaming;

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
        role="listitem"
        aria-current={isCursor ? 'true' : undefined}
        className={getListItemRowClasses(
          isActive,
          isCursor,
          isMarked,
          isParent,
          isCut,
          rowTextClass,
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
            {item.name}
          </span>
        </span>

        {linemode !== 'none' && !isGrid && (
          <span
            className={`text-[10px] w-24 text-right font-mono tabular-nums shrink-0 ${isCursor ? 'text-zinc-500' : 'text-zinc-700'}`}
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
            <span className="text-yellow-500 text-[10px] font-bold tracking-tighter">[VIS]</span>
          )}
        </div>

        {(item.type === 'dir' || item.type === 'archive') && !isGrid && (
          <span className="text-zinc-700 shrink-0">
            <ChevronRight size={12} strokeWidth={3} />
          </span>
        )}
      </div>

      {showRename && (
        <div className="mx-4 my-2 z-20 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl rounded-sm min-w-[250px] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
              Rename:
            </span>
            <input
              type="text"
              value={renameState?.inputBuffer}
              onChange={(e) => onRenameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit?.();
                if (e.key === 'Escape') onRenameCancel?.();
                e.stopPropagation();
              }}
              className="flex-1 bg-zinc-800 text-white font-mono text-sm px-2 py-1 border border-zinc-600 rounded-sm outline-none focus:border-green-500"
              autoFocus
            />
          </div>
          <div className="text-[10px] text-zinc-500 mt-2 font-mono">
            Enter new name • Enter to confirm • Esc to cancel
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export const MemoizedFileSystemItem = memo(FileSystemItem, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.isActive === next.isActive &&
    prev.isCursor === next.isCursor &&
    prev.isMarked === next.isMarked &&
    prev.isParent === next.isParent &&
    prev.isCut === next.isCut &&
    prev.isYank === next.isYank &&
    prev.linemode === next.linemode &&
    prev.isGrid === next.isGrid &&
    prev.renameState?.isRenaming === next.renameState?.isRenaming &&
    prev.renameState?.inputBuffer === next.renameState?.inputBuffer
  );
});
