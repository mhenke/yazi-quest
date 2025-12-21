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

export const FuzzyFinder: React.FC<FuzzyFinderProps> = ({ gameState, _onSelect, _onClose }) => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const listRef = useRef<HTMLDivElement>(null);
  
  // Specific theme for Level 7 "Quantum Tunnelling"
  const isQuantumLevel = gameState.levelIndex === 6; // Level 7 is index 6

  // 1. Get Base History/Content with explicit scores, sorted DESCENDING
  const baseItems = useMemo(() => {
    if (isZoxide) {
      return Object.keys(gameState.zoxideData)
        .map(path => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
        .sort((a, b) => {
          const diff = b.score - a.score;
          if (Math.abs(diff) > 0.0001) return diff;
          return a.path.localeCompare(b.path);
        });
    } else {
      // For FZF, search FILES only (not directories)
      return getRecursiveContent(gameState.fs, gameState.currentPath)
        .filter(c => c.type === 'file' || c.type === 'archive') // Only files and archives
        .map(c => ({ 
            path: c.display, 
            pathIds: c.path, 
            type: c.type, 
            id: c.id, 
            score: 0 
        }));
    }
  }, [isZoxide, gameState.zoxideData, gameState.fs, gameState.currentPath]);

  const totalCount = baseItems.length;

  // 2. Apply Filter - preserve existing sort order from baseItems
  const filteredCandidates = useMemo(() => {
    return baseItems.filter(c => c.path.toLowerCase().includes(gameState.inputBuffer.toLowerCase()));
  }, [baseItems, gameState.inputBuffer]);

  // 3. Determine Preview Items
  const selectedCandidate = filteredCandidates[gameState.fuzzySelectedIndex || 0];
  const previewItems = useMemo(() => {
    if (!selectedCandidate) return [];
    if (isZoxide) {
      const node = findNodeFromPath(gameState.fs, selectedCandidate.path);
      return node?.children || [];
    } else {
        const typedCandidate = selectedCandidate;
        if (typedCandidate.pathIds && Array.isArray(typedCandidate.pathIds)) {
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
    <div className={`absolute inset-0 z-[100] flex flex-col bg-zinc-950/98 font-mono animate-in fade-in duration-150 backdrop-blur-md ${isQuantumLevel ? 'border-2 border-purple-500/30' : ''}`}>
      
      {/* Top: Header/Filter Bar */}
      <div className={`px-6 py-4 border-b border-zinc-800 flex items-center justify-between ${isQuantumLevel ? 'bg-purple-950/20' : 'bg-zinc-900/80'}`}>
          <div className="flex items-center gap-3 text-lg">
              <span className={`${isQuantumLevel ? 'text-purple-400' : 'text-orange-500'} font-black tracking-tighter`}>&gt;</span>
              <div className="relative">
                <span className={`text-white font-bold min-w-[20px] px-1 border-b-2 ${isQuantumLevel ? 'border-purple-500' : 'border-orange-500'}`}>
                  {gameState.inputBuffer || ' '}
                </span>
                {!gameState.inputBuffer && (
                  <span className="absolute left-1 text-zinc-700 animate-pulse">Search...</span>
                )}
              </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="text-xs text-zinc-500 font-bold flex gap-2">
                <span className={isQuantumLevel ? 'text-purple-400' : 'text-orange-500'}>{filteredCandidates.length > 0 ? (gameState.fuzzySelectedIndex || 0) + 1 : 0}</span>
                <span className="opacity-30">/</span>
                <span>{totalCount}</span>
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${isQuantumLevel && isZoxide ? 'bg-purple-900 text-purple-200' : 'bg-zinc-800 text-zinc-400'}`}>
                {isQuantumLevel && isZoxide ? 'QUANTUM LINK' : isZoxide ? 'Zoxide' : 'FZF'}
              </div>
          </div>
      </div>

      {/* Main Content Area: Split List and Preview (Zoxide) OR Just List (FZF) */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Candidates List */}
        <div className={`${isZoxide ? 'h-1/2 border-b border-zinc-800' : 'flex-1'} overflow-y-auto scrollbar-hide`} ref={listRef}>
            {filteredCandidates.length === 0 ? (
                <div className="p-12 text-center text-zinc-700 italic text-sm">
                    No matching entries found in {isZoxide ? 'history' : 'this directory'}
                </div>
            ) : (
                <div className="flex flex-col">
                    {filteredCandidates.map((item, idx) => {
                        const isSelected = idx === (gameState.fuzzySelectedIndex || 0);
                        return (
                            <div 
                                key={item.path + idx}
                                className={`
                                    px-6 py-2 flex items-center text-sm transition-colors duration-100
                                    ${isSelected ? 'bg-zinc-800/80 text-white' : 'text-zinc-500 hover:text-zinc-400'}
                                `}
                            >
                                <div className="flex items-center gap-4 truncate flex-1">
                                    {/* Active Indicator */}
                                    <div className={`w-1 h-4 rounded-full transition-colors ${isSelected ? (isQuantumLevel ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]') : 'bg-transparent'}`} />
                                    
                                    {/* Score Pill (Zoxide only) */}
                                    {isZoxide && (
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums min-w-[36px] text-center ${isSelected ? (isQuantumLevel ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400') : 'text-zinc-600'}`}>
                                            {item.score?.toFixed(1)}
                                        </span>
                                    )}

                                    {/* Path Text */}
                                    <span className={`truncate ${isSelected ? 'font-bold' : ''} ${isQuantumLevel && isSelected ? 'text-purple-100' : ''}`}>
                                      {item.path}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Directory Preview Area - Zoxide only */}
        {isZoxide && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-[0.2em] flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-sm ${isQuantumLevel ? 'bg-purple-900' : 'bg-zinc-800'}`} />
                  Preview Contents
              </div>
              {selectedCandidate && (
                <div className="text-[9px] text-zinc-500 font-mono italic truncate max-w-[50%]">
                  {selectedCandidate.path}
                </div>
              )}
            </div>
            
            <div className={`flex-1 border rounded overflow-hidden relative shadow-inner ${isQuantumLevel ? 'border-purple-900/30' : 'border-zinc-800/50'}`}>
                {previewItems.length > 0 ? (
                    <div className="h-full w-full overflow-hidden">
                      <FileSystemPane 
                          items={previewItems}
                          isActive={false}
                          selectedIds={[]}
                          clipboard={null}
                          linemode="size"
                          className="w-full bg-transparent grid grid-cols-2 lg:grid-cols-3 gap-x-4 h-full content-start"
                      />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-800 text-sm font-bold tracking-widest uppercase opacity-50">
                        {selectedCandidate ? 'Empty Directory' : 'Waiting for selection...'}
                    </div>
                )}
            </div>
        </div>
        )}
      </div>

      {/* Pro Status Footer */}
      <div className={`px-6 py-2 border-t flex justify-between items-center ${isQuantumLevel ? 'bg-purple-950/10 border-purple-900/50' : 'bg-zinc-950 border-zinc-900'}`}>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-bold">J/K</span> Navigate
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-bold">ENTER</span> Select
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-bold">ESC</span> Cancel
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-zinc-800 rounded-full overflow-hidden">
               <div className={`h-full w-2/3 ${isQuantumLevel ? 'bg-purple-500' : 'bg-orange-500'}`} />
            </div>
            <span className="text-[10px] font-black text-zinc-600 tracking-tighter italic uppercase">
                {isQuantumLevel ? 'Quantum-Sync' : 'Yazi-OS'}
            </span>
          </div>
      </div>

    </div>
  );
};