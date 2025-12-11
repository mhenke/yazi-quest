import React, { useEffect, useRef } from 'react';
import { FileNode, ClipboardItem } from '../types';
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
  PackageOpen
} from 'lucide-react';

interface FileSystemPaneProps {
  items: FileNode[];
  isActive: boolean;
  cursorIndex?: number;
  title?: string;
  isParent?: boolean;
  selectedIds: string[];
  clipboard: ClipboardItem | null;
}

// Helper for file styling based on extension/name
const getFileStyle = (node: FileNode) => {
  if (node.type === 'dir') return { color: 'text-blue-400', icon: Folder };
  if (node.type === 'archive') return { color: 'text-red-400', icon: PackageOpen };
  
  const name = node.name.toLowerCase();
  
  // Images
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) {
    return { color: 'text-purple-400', icon: FileImage };
  }
  // Executables / Binaries
  if (/\.(exe|bin|sh|bat)$/.test(name)) {
    return { color: 'text-green-400', icon: TerminalIcon };
  }
  // Archives (File extensions)
  if (/\.(zip|tar|gz|7z|rar)$/.test(name)) {
    return { color: 'text-red-400', icon: FileArchive };
  }
  // Configs / Data
  if (/\.(json|toml|yaml|conf|ini|xml)$/.test(name)) {
    return { color: 'text-cyan-400', icon: FileCog };
  }
  // Code
  if (/\.(js|ts|tsx|py|rs|c|cpp|go|java)$/.test(name)) {
    return { color: 'text-yellow-400', icon: FileCode };
  }
  // Keys / Secrets
  if (/\.(pem|key|lock)$/.test(name)) {
    return { color: 'text-amber-600', icon: FileLock };
  }
  // Markdown / Text
  if (/\.(md|txt)$/.test(name)) {
    return { color: 'text-zinc-300', icon: FileText };
  }

  return { color: 'text-zinc-400', icon: FileText };
};

export const FileSystemPane: React.FC<FileSystemPaneProps> = ({ 
  items, 
  isActive, 
  cursorIndex = -1,
  title,
  isParent = false,
  selectedIds = [],
  clipboard
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll into view logic
  useEffect(() => {
    if (isActive && listRef.current && cursorIndex >= 0) {
      const children = listRef.current.children;
      if (children[cursorIndex]) {
        children[cursorIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [cursorIndex, isActive]);

  return (
    <div className={`flex flex-col h-full border-r border-zinc-800 transition-colors duration-300 ${isParent ? 'w-1/4 bg-zinc-950/50 text-zinc-600' : 'w-1/3 bg-zinc-900/80 text-zinc-300'}`}>
      {title && (
        <div className={`px-3 py-1 text-[10px] font-bold border-b border-zinc-800 uppercase tracking-wider flex items-center justify-between ${isParent ? 'text-zinc-600' : 'text-blue-400'}`}>
          <span>{title}</span>
          {!isParent && <span className="text-zinc-600">{items.length} nodes</span>}
        </div>
      )}
      
      <div ref={listRef} className="flex-1 overflow-y-auto py-1 scrollbar-hide">
        {items.length === 0 && (
          <div className="px-4 py-2 text-zinc-700 italic text-xs">~ empty ~</div>
        )}
        {items.map((item, idx) => {
          const isSelected = isActive && idx === cursorIndex;
          const isMarked = selectedIds.includes(item.id);
          const { color, icon: Icon } = getFileStyle(item);
          
          // Check clipboard status
          const inClipboard = clipboard?.nodes.some(n => n.id === item.id);
          const isCut = inClipboard && clipboard?.action === 'cut';
          const isYank = inClipboard && clipboard?.action === 'yank';

          return (
            <div
              key={item.id}
              className={`
                px-3 py-0.5 flex items-center gap-2 truncate font-mono cursor-default text-sm
                transition-colors duration-75 relative
                ${isSelected ? 'bg-zinc-800' : ''}
                ${isMarked ? 'text-yellow-400' : ''}
                ${isParent ? 'opacity-50 grayscale' : ''}
                ${isCut ? 'opacity-50' : ''}
              `}
            >
              <span className={`${isMarked ? 'text-yellow-500' : color} shrink-0`}>
                <Icon size={14} fill={item.type === 'dir' ? "currentColor" : "none"} fillOpacity={item.type === 'dir' ? 0.2 : 0} />
              </span>
              
              <span className={`truncate flex-1 flex items-center gap-2 ${isSelected && !isMarked ? 'text-white font-medium' : ''} ${isMarked ? 'font-bold' : ''}`}>
                <span className={`${isCut ? 'line-through decoration-red-500/50' : ''}`}>{item.name}</span>
              </span>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {isCut && <Scissors size={10} className="text-red-500 animate-pulse" />}
                {isYank && <Copy size={10} className="text-blue-400" />}
                {isMarked && <span className="text-yellow-500 text-[10px] font-bold tracking-tighter">[VIS]</span>}
              </div>
              
              {(item.type === 'dir' || item.type === 'archive') && (
                  <span className="text-zinc-700">
                    <ChevronRight size={12} strokeWidth={3} />
                  </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};