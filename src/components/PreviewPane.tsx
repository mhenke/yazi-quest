import React, { useEffect, useRef } from 'react';
import {
  FileText,
  FileArchive,
  PackageOpen,
  CheckSquare,
  Square,
  Folder,
  FileCode,
  FileImage,
  FileCog,
  FileLock,
  Terminal as TerminalIcon,
} from 'lucide-react';

import { sortNodes } from '../utils/sortHelpers';
import { FileNode, Level, GameState } from '../types';

interface PreviewPaneProps {
  node: FileNode | null;
  level: Level;
  gameState: GameState;
  previewScroll?: number;
}

// Helper for preview icons (simplified version of FileSystemPane style)
const getPreviewIcon = (node: FileNode) => {
  if (node.type === 'dir') return { color: 'text-blue-400', icon: Folder };
  if (node.type === 'archive') return { color: 'text-red-400', icon: PackageOpen };

  const name = node.name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(name))
    return { color: 'text-purple-400', icon: FileImage };
  if (/\.(exe|bin|sh|bat)$/.test(name)) return { color: 'text-green-400', icon: TerminalIcon };
  if (/\.(zip|tar|gz|7z|rar)$/.test(name)) return { color: 'text-red-400', icon: FileArchive };
  if (/\.(json|toml|yaml|conf|ini|xml)$/.test(name))
    return { color: 'text-cyan-400', icon: FileCog };
  if (/\.(js|ts|tsx|py|rs|c|cpp|go|java)$/.test(name))
    return { color: 'text-yellow-400', icon: FileCode };
  if (/\.(pem|key|lock)$/.test(name)) return { color: 'text-amber-600', icon: FileLock };

  return { color: 'text-zinc-400', icon: FileText };
};

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  node,
  level,
  gameState,
  previewScroll = 0,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isImage = node?.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(node.name);
  const isArchiveFile = node?.type === 'file' && /\.(zip|tar|gz|7z|rar)$/i.test(node.name);
  const isArchiveDir = node?.type === 'archive';
  // Render level description with runtime tokens replaced (e.g., <current_datetime>)
  const renderedDescription = (level.description || '').replace(
    /<current_datetime>/g,
    new Date().toISOString(),
  );

  // Treat archives as having children if they are dirs or zip files with children populated
  const hasChildren = node?.children && node.children.length > 0;
  const showChildren = node?.type === 'dir' || isArchiveDir || (isArchiveFile && hasChildren);

  useEffect(() => {
    if (scrollRef.current) {
      // Simple scroll based on line height approx 20px
      scrollRef.current.scrollTop = previewScroll * 20;
    }
  }, [previewScroll, node]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-300 h-full overflow-hidden border-l border-zinc-800">
      {/* Content Display Section (No Header) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {node ? (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* CASE 1: Image */}
            {isImage && (
              <div className="flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-zinc-800 rounded bg-zinc-900/30 p-4">
                <img
                  src={node.content}
                  alt={node.name}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerText = '[Image Load Failed]';
                  }}
                />
              </div>
            )}

            {/* CASE 2: Text Content */}
            {node.type === 'file' && !isImage && !showChildren && (
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400">
                {node.content || <span className="italic text-zinc-600">(Empty file)</span>}
              </div>
            )}

            {/* CASE 3: Directory / Archive Listing */}
            {showChildren && (
              <div className="flex flex-col gap-0.5">
                {!node.children || node.children.length === 0 ? (
                  <div className="text-zinc-600 italic text-xs pl-2">~ empty ~</div>
                ) : (
                  (() => {
                    const sorted = sortNodes(node.children || [], 'natural', 'asc');
                    return sorted.map((child) => {
                      const { icon: Icon, color } = getPreviewIcon(child);
                      return (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-900/50 rounded cursor-default"
                        >
                          <Icon size={12} className={color} />
                          <span
                            className={`text-xs font-mono truncate ${child.type === 'dir' ? 'text-blue-300' : 'text-zinc-400'}`}
                          >
                            {child.name}
                          </span>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-700">
            {/* Empty State */}
          </div>
        )}
      </div>

      {/* Bottom Section: Mission Log */}
      <div className="h-[45%] min-h-[250px] border-t border-zinc-800 bg-zinc-900/30 flex flex-col shrink-0">
        <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800">
          <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
            Mission Log: LVL {level.id} - <span className="normal-case">{level.title}</span>
          </h3>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-widest">
              Target
            </h3>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed">{level.description}</p>
          </div>
          <div>
            <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">
              Objectives
            </h3>
            <div className="space-y-2">
              {level.tasks
                .filter((task) => !task.hidden || !task.hidden(gameState, level))
                .map((task) => (
                  <div
                    key={task.id}
                    className={`flex gap-3 items-start transition-all duration-500 ${task.completed ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${task.completed ? 'text-green-500' : 'text-zinc-600'}`}
                    >
                      {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                    </div>
                    <div
                      className={`text-xs font-mono leading-tight ${task.completed ? 'line-through text-zinc-500 decoration-zinc-600' : 'text-zinc-300'}`}
                    >
                      {task.description}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MemoizedPreviewPane = React.memo(PreviewPane);
