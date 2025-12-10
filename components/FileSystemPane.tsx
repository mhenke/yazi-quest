import React, { useEffect, useRef } from 'react';
import { FileNode } from '../types';
import { Folder, FileText, ChevronRight } from 'lucide-react';

interface FileSystemPaneProps {
  items: FileNode[];
  isActive: boolean;
  cursorIndex?: number;
  title?: string;
  isParent?: boolean;
  selectedIds: string[];
}

export const FileSystemPane: React.FC<FileSystemPaneProps> = ({ 
  items, 
  isActive, 
  cursorIndex = -1,
  title,
  isParent = false,
  selectedIds = []
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
    <div className={`flex flex-col h-full border-r border-zinc-700 bg-zinc-900 ${isParent ? 'w-1/4 text-zinc-500' : 'w-1/3 text-zinc-300'}`}>
      {title && (
        <div className="px-3 py-1 text-xs font-bold bg-zinc-800 text-zinc-400 border-b border-zinc-700 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div ref={listRef} className="flex-1 overflow-y-auto py-1">
        {items.length === 0 && (
          <div className="px-4 py-2 text-zinc-600 italic">Empty</div>
        )}
        {items.map((item, idx) => {
          const isSelected = isActive && idx === cursorIndex;
          const isMarked = selectedIds.includes(item.id);
          
          return (
            <div
              key={item.id}
              className={`
                px-3 py-1 flex items-center gap-2 truncate text-sm font-mono cursor-default
                ${isSelected ? 'bg-zinc-700' : ''}
                ${isMarked ? 'text-yellow-400' : isSelected ? 'text-white' : ''}
                ${isParent ? 'opacity-60' : ''}
              `}
            >
              <span className={item.type === 'dir' ? 'text-blue-400' : 'text-zinc-400'}>
                {item.type === 'dir' ? <Folder size={14} fill="currentColor" fillOpacity={0.2} /> : <FileText size={14} />}
              </span>
              <span className="truncate flex-1">{item.name}</span>
              {isMarked && <span className="text-yellow-500 text-xs font-bold">[S]</span>}
              {item.type === 'dir' && <ChevronRight size={12} className="opacity-50" />}
            </div>
          );
        })}
      </div>
      {isActive && (
         <div className="px-3 py-1 border-t border-zinc-700 text-xs text-zinc-500 flex justify-between">
           <span>{items.length} items</span>
           <span>{(cursorIndex + 1)}/{items.length}</span>
         </div>
      )}
    </div>
  );
};
