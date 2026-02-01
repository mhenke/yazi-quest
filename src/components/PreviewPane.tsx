import React, { useEffect, useRef, memo } from 'react';
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
  ShieldAlert,
} from 'lucide-react';

import { sortNodes } from '../utils/sortHelpers';
import { isProtected } from '../utils/fsHelpers';
import { FileNode, Level, GameState } from '../types';
import { Action } from '../hooks/gameReducer';

interface PreviewPaneProps {
  node: FileNode | null;
  level: Level;
  gameState: GameState;
  previewScroll?: number;
  dispatch?: React.Dispatch<Action>;
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
  dispatch,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isArchiveFile = node?.type === 'file' && /\.(zip|tar|gz|7z|rar)$/i.test(node.name);
  const isArchiveDir = node?.type === 'archive';
  const isImage = node?.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(node.name);
  // Render level description with runtime tokens replaced (e.g., <current_datetime>)

  // Treat archives as having children if they are dirs or zip files with children populated
  const hasChildren = node?.children && node.children.length > 0;
  const showChildren = node?.type === 'dir' || isArchiveDir || (isArchiveFile && hasChildren);

  useEffect(() => {
    if (scrollRef.current) {
      // Calculate the actual maximum scrollable distance
      const maxScrollValue = Math.max(
        0,
        scrollRef.current.scrollHeight - scrollRef.current.clientHeight
      );
      // Calculate the maximum possible previewScroll value based on actual content
      const maxPreviewScroll = Math.ceil(maxScrollValue / 20);

      // If the current previewScroll exceeds the maximum possible value, update the game state
      if (previewScroll > maxPreviewScroll && dispatch) {
        // Update the gameState to clamp the previewScroll value
        dispatch({ type: 'SET_PREVIEW_SCROLL', scroll: maxPreviewScroll });
      }

      // Ensure previewScroll doesn't exceed the maximum possible value
      const boundedPreviewScroll = Math.min(previewScroll, maxPreviewScroll);

      // Apply the scroll position
      scrollRef.current.scrollTop = boundedPreviewScroll * 20;
    }
  }, [previewScroll, node, dispatch]);

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
            {showChildren &&
              (() => {
                // Check if this directory/node is protected from viewing
                const protectionMessage = isProtected(
                  gameState.fs,
                  gameState.currentPath,
                  node,
                  level,
                  'enter'
                );

                if (protectionMessage) {
                  // Show access denied message for protected directories
                  return (
                    <div className="flex flex-col items-center justify-center min-h-[100px] gap-3 text-zinc-500">
                      <ShieldAlert size={32} className="text-red-500/70" />
                      <div className="text-xs font-mono text-center">
                        <div className="text-red-500/80">[RESTRICTED]</div>
                        <div className="mt-1 text-zinc-600">{protectionMessage}</div>
                      </div>
                    </div>
                  );
                }

                // Normal directory listing
                if (!node.children || node.children.length === 0) {
                  return <div className="text-zinc-600 italic text-xs pl-2">~ empty ~</div>;
                }

                const sorted = sortNodes(node.children || [], 'natural', 'asc');
                const filtered = sorted.filter(
                  (child) => gameState.showHidden || !child.name.startsWith('.')
                );

                if (filtered.length === 0) {
                  return <div className="text-zinc-600 italic text-xs pl-2">~ empty ~</div>;
                }

                return (
                  <div className="flex flex-col gap-0.5">
                    {filtered.map((child) => {
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
                    })}
                  </div>
                );
              })()}
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
              {(() => {
                const completedTaskIds = gameState.completedTaskIds[level.id] || [];
                return level.tasks
                  .filter((task) => !task.hidden || !task.hidden(gameState, level))
                  .map((task) => {
                    const isTaskCompleted = completedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`flex gap-3 items-start transition-all duration-500 ${isTaskCompleted ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 ${isTaskCompleted ? 'text-green-500' : 'text-zinc-600'}`}
                        >
                          {isTaskCompleted ? <CheckSquare size={14} /> : <Square size={14} />}
                        </div>
                        <div
                          className={`text-xs font-mono leading-tight ${isTaskCompleted ? 'line-through text-zinc-500 decoration-zinc-600' : 'text-zinc-300'}`}
                        >
                          {task.description}
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MemoizedPreviewPane = memo(PreviewPane);
