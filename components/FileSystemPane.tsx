import React, { useEffect, useRef } from "react";
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
} from "lucide-react";

import { FileNode, ClipboardItem, Linemode } from "../types";

interface FileSystemPaneProps {
  items: FileNode[];
  isActive: boolean;
  cursorIndex?: number;
  isParent?: boolean;
  selectedIds: string[];
  clipboard: ClipboardItem | null;
  linemode: Linemode;
  className?: string;
  renameState?: {
    isRenaming: boolean;
    inputBuffer: string;
  };
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}

const getFileStyle = (node: FileNode) => {
  if (node.type === "dir") return { color: "text-blue-400", icon: Folder };
  if (node.type === "archive") return { color: "text-red-400", icon: PackageOpen };

  const name = node.name.toLowerCase();

  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) {
    return { color: "text-purple-400", icon: FileImage };
  }
  if (/\.(exe|bin|sh|bat)$/.test(name)) {
    return { color: "text-green-400", icon: TerminalIcon };
  }
  if (/\.(zip|tar|gz|7z|rar)$/.test(name)) {
    return { color: "text-red-400", icon: FileArchive };
  }
  if (/\.(json|toml|yaml|conf|ini|xml)$/.test(name)) {
    return { color: "text-cyan-400", icon: FileCog };
  }
  if (/\.(js|ts|tsx|py|rs|c|cpp|go|java)$/.test(name)) {
    return { color: "text-yellow-400", icon: FileCode };
  }
  if (/\.(pem|key|lock)$/.test(name)) {
    return { color: "text-amber-600", icon: FileLock };
  }
  if (/\.(md|txt)$/.test(name)) {
    return { color: "text-zinc-300", icon: FileText };
  }

  return { color: "text-zinc-400", icon: FileText };
};

const formatSize = (node: FileNode) => {
  if (node.type === "dir" || node.type === "archive") {
    const count = node.children?.length || 0;
    return `${count}`;
  }
  const bytes = node.content?.length || 0;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

const getFakeDate = (node: FileNode) => {
  let hash = 0;
  for (let i = 0; i < node.id.length; i++) {
    hash = (hash << 5) - hash + node.id.charCodeAt(i);
    hash |= 0;
  }
  const d = Date.now();
  const offset = Math.abs(hash) % (30 * 24 * 60 * 60 * 1000);
  const date = new Date(d - offset);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const getPermissions = (node: FileNode) => {
  return node.type === "dir" || node.type === "archive" ? "drwxr-xr-x" : "-rw-r--r--";
};

const getListItemRowClasses = (
  isActive: boolean,
  isCursor: boolean,
  isMarked: boolean,
  isParent: boolean,
  isCut: boolean,
  rowText: string
): string => {
  let rowBg = "";

  if (isCursor) {
    if (isActive) {
      rowBg = "bg-zinc-800";
    } else {
      rowBg = "bg-zinc-800/40";
    }
  }

  const baseClasses = `px-3 py-0.5 flex items-center gap-2 truncate font-mono cursor-default text-sm transition-colors duration-75 relative`;

  return `
    ${baseClasses}
    ${rowBg}
    ${isMarked ? "text-yellow-400" : rowText}
    ${isParent && !isCursor ? "opacity-50 grayscale" : ""}
    ${isCut ? "opacity-50" : ""}
  `;
};

export const FileSystemPane: React.FC<FileSystemPaneProps> = ({
  items,
  isActive,
  cursorIndex = -1,
  isParent = false,
  selectedIds = [],
  clipboard,
  linemode,
  className,
  renameState,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && cursorIndex >= 0) {
      const children = listRef.current.children;
      if (children[cursorIndex]) {
        children[cursorIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [cursorIndex]);

  const defaultWidth = isParent ? "w-1/3" : "flex-1";
  const bgColors = isParent ? "bg-zinc-950/50 text-zinc-600" : "bg-zinc-900/80 text-zinc-300";

  // Use className directly if it contains grid layout classes, otherwise append default bg/width
  const finalClass = className?.includes("grid")
    ? className
    : `${defaultWidth} ${bgColors} ${className || ""}`;

  return (
    <div
      className={`flex flex-col h-full border-r border-zinc-800 transition-colors duration-300 ${finalClass}`}
    >
      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto py-1 scrollbar-hide relative ${className?.includes("grid") ? className : ""}`}
      >
        {items.length === 0 && (
          <div className="absolute top-10 w-full text-center text-zinc-600 font-mono text-sm select-none">
            No items
          </div>
        )}
        {items.map((item, idx) => {
          const isCursor = idx === cursorIndex;
          const isMarked = selectedIds.includes(item.id);
          const { color, icon: Icon } = getFileStyle(item);

          const inClipboard = clipboard?.nodes.some(n => n.id === item.id);
          const isCut = inClipboard && clipboard?.action === "cut";
          const isYank = inClipboard && clipboard?.action === "yank";

          let rowTextClass = "";
          if (isCursor) {
            if (isActive) {
              if (!isMarked) rowTextClass = "text-white font-medium";
            } else {
              if (!isMarked) rowTextClass = "text-zinc-400";
            }
          }

          const showRename = isActive && isCursor && renameState?.isRenaming;

          return (
            <React.Fragment key={item.id}>
              <div
                className={getListItemRowClasses(
                  isActive,
                  isCursor,
                  isMarked,
                  isParent,
                  isCut,
                  rowTextClass
                )}
              >
                <span className={`${isMarked ? "text-yellow-500" : color} shrink-0`}>
                  <Icon
                    size={14}
                    fill={item.type === "dir" ? "currentColor" : "none"}
                    fillOpacity={item.type === "dir" ? 0.2 : 0}
                  />
                </span>

                <span
                  className={`truncate flex-1 flex items-center gap-2 ${isMarked ? "font-bold" : ""}`}
                >
                  <span className={`${isCut ? "line-through decoration-red-500/50" : ""}`}>
                    {item.name}
                  </span>
                </span>

                {linemode !== "none" && !className?.includes("grid") && (
                  <span
                    className={`text-[10px] w-24 text-right font-mono tabular-nums shrink-0 ${isCursor ? "text-zinc-500" : "text-zinc-700"}`}
                  >
                    {linemode === "size" && formatSize(item)}
                    {linemode === "mtime" && getFakeDate(item)}
                    {linemode === "permissions" && getPermissions(item)}
                  </span>
                )}

                <div className="flex items-center gap-2 min-w-[20px] justify-end">
                  {isCut && <Scissors size={10} className="text-red-500 animate-pulse" />}
                  {isYank && <Copy size={10} className="text-blue-400" />}
                  {isMarked && (
                    <span className="text-yellow-500 text-[10px] font-bold tracking-tighter">
                      [VIS]
                    </span>
                  )}
                </div>

                {(item.type === "dir" || item.type === "archive") &&
                  !className?.includes("grid") && (
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
                      onChange={e => onRenameChange?.(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") onRenameSubmit?.();
                        if (e.key === "Escape") onRenameCancel?.();
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
        })}
      </div>
    </div>
  );
};

export const MemoizedFileSystemPane = React.memo(FileSystemPane);
