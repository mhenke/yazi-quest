import React, { useEffect, useRef, useMemo } from 'react';
import { calculateFrecency, GameState, FileNode } from '../types';
import { getRecursiveContent, getNodeByPath } from '../utils/fsHelpers';
import { FileSystemPane } from './FileSystemPane';

interface FuzzyFinderProps {
  gameState: GameState;
  onSelect: (path: string, isZoxide: boolean) => void;
  onClose: () => void;
}

const findNodeFromPath = (root: FileNode, pathStr: string): FileNode | null => {
  if (pathStr === '/') return root;
  const parts = pathStr.split('/').filter(p => p);
  
  let current = root;
  for (const part of parts) {
    if (!current.children) return null;
    const next = current.children.find(c => c.name === part);
    if (!next) return null;
    current = next;
  }
  return current;
};

export const FuzzyFinder: React.FC<FuzzyFinderProps> = ({ gameState, onSelect, onClose }) => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Get Base History/Content
  const baseItems = useMemo(() => {
    if (isZoxide) {
      return Object.keys(gameState.zoxideData)
        .map(path => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
        .sort((a, b) => b.score - a.score);
    } else {
      return getRecursiveContent(gameState.fs, gameState.currentPath)
        // Fix: Explicitly map properties to avoid 'path' name conflict between display string and string array
        // (getRecursiveContent returns path: string[], we need path: string for filtering)
        .map(c => ({ path: c.display, pathIds: c.path, type: c.type, id: c.id }));
    }
  }, [isZoxide, gameState.zoxideData, gameState.fs, gameState.currentPath]);

  const totalCount = baseItems.length;

  // 2. Apply Filter
  const filteredCandidates = useMemo(() => {
    // Fix: line 46 - item.path is now guaranteed to be a string
    return baseItems.filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
  }, [baseItems, gameState.inputBuffer]);

  // 3. Determine Preview Items
  const selectedCandidate = filteredCandidates[gameState.fuzzySelectedIndex || 0];
  const previewItems = useMemo(() => {
    if (!selectedCandidate) return [];
    if (isZoxide) {
      // Fix: line 54 - selectedCandidate.path is now string
      const node = findNodeFromPath(gameState.fs, selectedCandidate.path);
      return node?.children || [];
    } else {
        const typedCandidate = selectedCandidate as any;
        if (typedCandidate.pathIds && Array.isArray(typedCandidate.pathIds)) {
            // Fix: Resolve full path from root for FZF preview items as pathIds are relative to currentPath
            const fullNodePath = [...gameState.currentPath, ...typedCandidate.pathIds];
            const parentPath = fullNodePath.slice(0, -1);
            const parentNode = getNodeByPath(gameState.fs, parentPath);
            return parentNode?.children || [];
        }
        return [];
    }
  }, [selectedCandidate, isZoxide, gameState.fs, gameState.currentPath]);

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[gameState.fuzzySelectedIndex || 0] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [gameState.fuzzySelectedIndex, filteredCandidates.length]);

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-zinc-950/95 font-mono animate-in fade-in duration-150">
      
      {/* Top: Header/Filter Bar */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-600 font-bold">&gt;</span>
              <span className="text-white font-bold min-w-[20px] px-1 border-b border-orange-500">
                {gameState.inputBuffer || ' '}
              </span>
              <span className="text-zinc-600 font-bold">&lt;</span>
          </div>
          <div className="text-xs text-zinc-500 font-bold">
              {filteredCandidates.length > 0 ? (gameState.fuzzySelectedIndex || 0) + 1 : 0} / {totalCount}
          </div>
      </div>

      {/* Top Half: Candidates List */}
      <div className="h-2/5 overflow-y-auto border-b border-zinc-800" ref={listRef}>
          {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-zinc-700 italic text-sm">
                  No matching entries
              </div>
          ) : (
              <div className="flex flex-col">
                  {filteredCandidates.map((item, idx) => {
                      const isSelected = idx === (gameState.fuzzySelectedIndex || 0);
                      return (
                          <div 
                              // Fix: line 105 - item.path is string
                              key={item.path + idx}
                              className={`
                                  px-4 py-1.5 flex items-center justify-between text-sm
                                  ${isSelected ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}
                              `}
                          >
                              <div className="truncate flex-1">
                                  {item.path}
                              </div>
                              {isZoxide && (
                                  <span className="text-[10px] opacity-30 ml-4">
                                      {(item as any).score?.toFixed(1)}
                                  </span>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* Bottom Half: Directory Preview */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/20">
          <div className="px-4 py-1 bg-zinc-900/30 text-[10px] uppercase font-bold text-zinc-600 tracking-widest border-b border-zinc-800/50">
              Content Preview
          </div>
          <div className="flex-1 overflow-hidden relative">
              {previewItems.length > 0 ? (
                  <FileSystemPane 
                      items={previewItems}
                      isActive={false}
                      selectedIds={[]}
                      clipboard={null}
                      linemode="size"
                      className="w-full bg-transparent px-2"
                  />
              ) : (
                  <div className="flex items-center justify-center h-full text-zinc-800 text-sm italic">
                      {selectedCandidate ? 'Empty directory' : 'Select a path to preview'}
                  </div>
              )}
          </div>
      </div>

      {/* Tiny Status Footer */}
      <div className="px-4 py-1 border-t border-zinc-900 text-[9px] text-zinc-700 flex justify-between bg-black">
          <span>j/k: Navigate • Enter: Select • Esc: Cancel</span>
          <span className="font-bold tracking-widest uppercase">{isZoxide ? 'ZOXIDE JUMP' : 'FZF FIND'}</span>
      </div>

    </div>
  );
};