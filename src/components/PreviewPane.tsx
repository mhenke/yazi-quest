import React, { useEffect, useRef, memo } from 'react';
import { ShieldAlert } from 'lucide-react';

import { sortNodes } from '../utils/sortHelpers';
import { isProtected } from '../utils/fsHelpers';
import { FileNode, Level, GameState } from '../types';
import { Action } from '../hooks/gameReducer';
import { MissionDrawer } from './MissionDrawer';
import { getFileStyle } from './fileIcon';

interface PreviewPaneProps {
  node: FileNode | null;
  level: Level;
  gameState: GameState;
  previewScroll?: number;
  dispatch?: React.Dispatch<Action>;
  isMissionDrawerOpen?: boolean;
  onToggleMissionDrawer?: () => void;
}

// fallow-ignore-next-line complexity
const PreviewPane: React.FC<PreviewPaneProps> = ({
  node,
  level,
  gameState,
  previewScroll = 0,
  dispatch,
  isMissionDrawerOpen = true,
  onToggleMissionDrawer,
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
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            tabIndex={0}
            role="region"
            aria-label="File preview"
          >
            {/* CASE 1: Image */}
            {isImage && (
              <div className="flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-zinc-800 rounded bg-zinc-900/30 p-4">
                <img
                  src={node.content}
                  alt={node.name}
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                />
              </div>
            )}

            {/* CASE 2: Text Content */}
            {node.type === 'file' && !isImage && !showChildren && (
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400">
                {node.content || <span className="italic text-zinc-400">(Empty file)</span>}
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
                    <div className="flex flex-col items-center justify-center min-h-[100px] gap-3 text-zinc-400">
                      <ShieldAlert size={32} className="text-red-400" aria-hidden="true" />
                      <div className="text-xs font-mono text-center">
                        <div className="text-red-400">[RESTRICTED]</div>
                        <div className="mt-1 text-zinc-400">{protectionMessage}</div>
                      </div>
                    </div>
                  );
                }

                // Normal directory listing
                if (!node.children || node.children.length === 0) {
                  return <div className="text-zinc-400 italic text-xs pl-2">~ empty ~</div>;
                }

                const sorted = sortNodes(node.children || [], 'natural', 'asc');
                const filtered = sorted.filter(
                  (child) => gameState.showHidden || !child.name.startsWith('.')
                );

                if (filtered.length === 0) {
                  return <div className="text-zinc-400 italic text-xs pl-2">~ empty ~</div>;
                }

                return (
                  <div className="flex flex-col gap-0.5">
                    {filtered.map((child) => {
                      const { icon: Icon, color } = getFileStyle(child);
                      return (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-900/50 rounded cursor-default"
                        >
                          <Icon size={12} className={color} />
                          <span
                            className={`text-xs font-mono truncate ${child.type === 'dir' ? 'text-cyan-400' : 'text-zinc-400'}`}
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

      {/* Bottom Section: Mission Log Drawer */}
      <MissionDrawer
        level={level}
        gameState={gameState}
        isExpanded={isMissionDrawerOpen}
        onToggle={onToggleMissionDrawer || (() => {})}
      />
    </div>
  );
};

export const MemoizedPreviewPane = memo(PreviewPane);
