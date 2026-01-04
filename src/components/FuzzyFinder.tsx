import React, { useEffect, useRef, useMemo } from 'react';

import { calculateFrecency, GameState } from '../types';
import {
  getRecursiveContent,
  getNodeByPath,
  getAllDirectoriesWithPaths,
  resolvePath,
} from '../utils/fsHelpers';

interface FuzzyFinderProps {
  gameState: GameState;
  onSelect: (path: string, isZoxide: boolean, pathIds?: string[]) => void;
  onClose: () => void;
}

const highlightMatch = (text: string, rawQuery: string, accentClass: string) => {
  if (!rawQuery) return text;
  const query = rawQuery.toLowerCase();
  const lower = text.toLowerCase();

  // Prefer contiguous substring match first (e.g., "thum" in "thumbnails")
  const idx = lower.indexOf(query);
  if (idx >= 0) {
    return text.split('').map((ch, i) => {
      const isMatch = i >= idx && i < idx + query.length;
      return (
        <span key={`${text}-${i}`} className={isMatch ? `${accentClass} font-semibold` : undefined}>
          {ch}
        </span>
      );
    });
  }

  // Fallback to sequential fuzzy highlight (original behavior)
  let qi = 0;
  return text.split('').map((ch, idx) => {
    const isMatch = qi < query.length && ch.toLowerCase() === query[qi];
    if (isMatch) qi += 1;
    return (
      <span key={`${text}-${idx}`} className={isMatch ? `${accentClass} font-semibold` : undefined}>
        {ch}
      </span>
    );
  });
};

type Candidate =
  | { path: string; score: number }
  | { path: string; pathIds?: string[]; type: 'file' | 'archive'; id: string; score: number };

const previewColor = (type?: 'file' | 'dir' | 'archive') => {
  switch (type) {
    case 'dir':
      return 'text-sky-400';
    case 'archive':
      return 'text-amber-400';
    default:
      return 'text-zinc-200';
  }
};

export const FuzzyFinder: React.FC<FuzzyFinderProps> = ({
  gameState,
  onSelect: _onSelect,
  onClose: _onClose,
}) => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const listRef = useRef<HTMLDivElement>(null);
  const query = (gameState.inputBuffer || '').trim();

  // Specific theme for Level 7 "Quantum Tunnelling"
  const isQuantumLevel = gameState.levelIndex === 6; // Level 7 is index 6

  const accentTextClass = isZoxide
    ? isQuantumLevel
      ? 'text-purple-300'
      : 'text-orange-300'
    : isQuantumLevel
      ? 'text-purple-300'
      : 'text-orange-300';

  // 1. Get Base History/Content with explicit scores, sorted DESCENDING
  const baseItems = useMemo(() => {
    if (isZoxide) {
      const zKeys = Object.keys(gameState.zoxideData);
      const dirs = getAllDirectoriesWithPaths(gameState.fs).map((d) =>
        resolvePath(gameState.fs, d.path),
      );
      return dirs
        .filter((path) => zKeys.includes(path))
        .map((path) => ({ path, score: calculateFrecency(gameState.zoxideData[path]) }))
        .sort((a, b) => {
          const diff = b.score - a.score;
          if (Math.abs(diff) > 0.0001) return diff;
          return a.path.localeCompare(b.path);
        });
    } else {
      // FZF-style: files only, recursively from current path (matches Yazi fzf behavior)
      return getRecursiveContent(gameState.fs, gameState.currentPath)
        .filter((c) => c.type === 'file' || c.type === 'archive')
        .map((c) => {
          // `getRecursiveContent` adds runtime `display` and `path` to nodes.
          const display = (c as { display?: string; path?: string[] }).display;
          const safePath =
            typeof display === 'string' && display
              ? display
              : String((c as { path?: string[] }).path || []).replace(/,/g, '/');
          return {
            path: safePath,
            pathIds: (c as { path?: string[] }).path,
            type: c.type as 'file' | 'archive',
            id: c.id,
            score: 0,
          } as Candidate;
        });
    }
  }, [isZoxide, gameState.zoxideData, gameState.fs, gameState.currentPath]);

  const totalCount = baseItems.length;

  // 2. Apply Filter - preserve existing sort order from baseItems
  const filteredCandidates = useMemo(() => {
    const q = query.toLowerCase();
    return baseItems.filter((c) => {
      // Both candidate shapes expose `path` as string
      const p = String((c as Candidate).path || '');
      return p.toLowerCase().includes(q);
    });
  }, [baseItems, query]);

  // 3. Determine Preview Items
  const selectedCandidate = filteredCandidates[gameState.fuzzySelectedIndex || 0];
  const previewItems = useMemo(() => {
    if (!selectedCandidate) return [];
    if (isZoxide) {
      const dirs = getAllDirectoriesWithPaths(gameState.fs).map((d) => ({
        node: d.node,
        display: resolvePath(gameState.fs, d.path),
      }));
      const match = dirs.find((d) => d.display === selectedCandidate.path);
      return match?.node.children || [];
    } else {
      if (
        selectedCandidate &&
        'pathIds' in selectedCandidate &&
        Array.isArray(selectedCandidate.pathIds)
      ) {
        const fullNodePath =
          selectedCandidate.pathIds[0] === gameState.fs.id
            ? selectedCandidate.pathIds
            : [...gameState.currentPath, ...(selectedCandidate.pathIds || [])];
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

  const currentIndex = filteredCandidates.length > 0 ? (gameState.fuzzySelectedIndex || 0) + 1 : 0;
  const filteredCount = filteredCandidates.length || 0;
  const countDisplay = isZoxide
    ? `${currentIndex}/${filteredCount || totalCount}`
    : `< ${filteredCount}/${totalCount}`;

  return (
    <div
      className={`absolute inset-0 ${isZoxide ? 'right-[30%] lg:right-[34%]' : ''} z-[100] flex flex-col bg-zinc-950/98 font-mono animate-in fade-in duration-100 backdrop-blur-md ${isQuantumLevel ? 'border-2 border-purple-500/30' : 'border border-zinc-900'}`}
    >
      <div className="px-4 py-2 text-[11px] text-zinc-500 flex items-center gap-3 border-b border-zinc-900">
        <span className={`${accentTextClass} font-semibold tabular-nums`}>{countDisplay}</span>
        {isZoxide && (
          <>
            <span className="uppercase tracking-[0.2em] text-zinc-600">zoxide jump</span>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className={`${accentTextClass} font-semibold`}>&gt;</span>
              {query ? (
                <span className="text-zinc-100 truncate max-w-[55vw]">{query}</span>
              ) : (
                <span className="text-zinc-600 italic">enter search here...</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div
          className={`${isZoxide ? 'flex-1 border-b border-zinc-900' : 'flex-1'} overflow-y-auto scrollbar-hide`}
          ref={listRef}
        >
          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-zinc-700 italic text-sm">
              No matches in {isZoxide ? 'zoxide history' : 'recursive search'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredCandidates.map((item, idx) => {
                const isSelected = idx === (gameState.fuzzySelectedIndex || 0);
                return (
                  <div
                    key={String(item.path) + idx}
                    onClick={() =>
                      _onSelect(String(item.path), isZoxide, (item as Candidate).pathIds)
                    }
                    className={`px-4 py-2 flex items-center gap-3 text-sm transition-colors duration-75 cursor-pointer ${
                      isSelected ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {isZoxide && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded tabular-nums min-w-[36px] text-center ${
                          isSelected
                            ? isQuantumLevel
                              ? 'bg-purple-900/40 text-purple-200'
                              : 'bg-orange-900/40 text-orange-200'
                            : 'text-zinc-600'
                        }`}
                      >
                        {item.score?.toFixed(1)}
                      </span>
                    )}

                    <span className="truncate">
                      {highlightMatch(String(item.path), query, accentTextClass)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isZoxide && (
          <div className="h-[38%] min-h-[180px] flex flex-col bg-zinc-950/80">
            <div className="px-4 py-2 text-[10px] uppercase font-bold text-zinc-600 tracking-[0.2em] flex items-center gap-2 border-b border-zinc-900">
              <div
                className={`w-2 h-2 rounded-sm ${isQuantumLevel ? 'bg-purple-900' : 'bg-zinc-800'}`}
              />
              Preview
              {selectedCandidate && (
                <span className="text-[9px] font-normal text-zinc-500 truncate max-w-[45%]">
                  {selectedCandidate.path}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 text-sm leading-relaxed bg-zinc-950/60">
              {previewItems.length > 0 ? (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                >
                  {previewItems
                    .slice()
                    .sort((a, b) => {
                      // directories first, then alphabetical
                      if (a.type === b.type) return a.name.localeCompare(b.name);
                      if (a.type === 'dir') return -1;
                      if (b.type === 'dir') return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((child) => (
                      <div key={child.id} className="truncate">
                        <span className={`${previewColor(child.type)} font-mono`}>
                          {child.name}
                          {child.type === 'dir' ? '/' : ''}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-zinc-700 italic">
                  {selectedCandidate ? '(empty)' : 'Waiting for selection'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-zinc-900 flex items-center gap-3 text-sm bg-zinc-950/90">
        {!isZoxide && (
          <>
            <span className={`${accentTextClass} font-semibold`}>&gt;</span>
            {query ? (
              <span className="text-zinc-100 truncate">{query}</span>
            ) : (
              <span className="text-zinc-600 italic">enter search here...</span>
            )}
          </>
        )}
        <span className="ml-auto text-[11px] text-zinc-500 tabular-nums">{countDisplay}</span>
      </div>
    </div>
  );
};
