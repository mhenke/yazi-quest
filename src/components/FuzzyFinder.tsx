import React, { useEffect, useRef, useMemo } from 'react';

import { GameState } from '../types';
import { getNodeByPath, getAllDirectoriesWithPaths, resolvePath } from '../utils/fsHelpers';
import {
  getBaseFuzzyCandidates,
  filterFuzzyCandidates,
  FuzzyCandidate,
} from '../utils/fuzzyHelpers';

interface FuzzyFinderProps {
  gameState: GameState;
  onSelect: (path: string, isZoxide: boolean, pathIds?: string[]) => void;
  onClose: () => void;
}

const highlightMatch = (text: string, rawQuery: string, accentClass: string): React.ReactNode => {
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

  // 1. Get Base History/Content
  const baseItems = useMemo(() => getBaseFuzzyCandidates(gameState), [gameState]);

  const totalCount = baseItems.length;

  // 2. Apply Filter - preserve existing sort order from baseItems
  const filteredCandidates = useMemo(
    () => filterFuzzyCandidates(baseItems, query),
    [baseItems, query]
  );

  // 3. Determine Preview Items
  const selectedCandidate = filteredCandidates[gameState.fuzzySelectedIndex || 0] as
    | FuzzyCandidate
    | undefined;
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
        Array.isArray((selectedCandidate as unknown as { pathIds?: string[] }).pathIds)
      ) {
        const pathIds = (selectedCandidate as unknown as { pathIds?: string[] }).pathIds || [];
        const fullNodePath =
          pathIds[0] === gameState.fs.id ? pathIds : [...gameState.currentPath, ...pathIds];
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
      data-testid="fuzzy-finder"
      className={`absolute inset-0 z-[100] flex flex-col bg-zinc-950/98 font-mono animate-in fade-in duration-100 backdrop-blur-md ${isQuantumLevel ? 'border-2 border-purple-500/30' : 'border border-zinc-900'}`}
    >
      <div className="px-4 py-2 text-xs text-zinc-400 flex items-center gap-3 border-b border-zinc-900">
        <span className={`${accentTextClass} font-semibold tabular-nums`}>{countDisplay}</span>
        {isZoxide && (
          <>
            <span className="uppercase tracking-[0.2em] text-zinc-400">zoxide jump</span>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className={`${accentTextClass} font-semibold`}>&gt;</span>
              {query ? (
                <span className="text-zinc-100 truncate max-w-[55vw]">{query}</span>
              ) : (
                <span className="text-zinc-500 italic">enter search here...</span>
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
            <div className="p-8 text-center text-zinc-400 italic text-sm">
              No matches in {isZoxide ? 'zoxide history' : 'recursive search'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredCandidates.map((item, idx: number) => {
                const isSelected = idx === (gameState.fuzzySelectedIndex || 0);
                return (
                  <div
                    key={String(item.path) + idx}
                    data-testid={`file-${item.path}`}
                    onClick={() =>
                      _onSelect(
                        String(item.path),
                        isZoxide,
                        (item as unknown as { pathIds?: string[] }).pathIds
                      )
                    }
                    className={`px-4 py-2 flex items-center gap-3 text-sm transition-colors duration-75 cursor-pointer ${
                      isSelected ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isZoxide && (
                      <span
                        className={`text-xs font-mono font-semibold px-2 py-0.5 rounded tabular-nums min-w-[36px] text-center ${
                          isSelected
                            ? isQuantumLevel
                              ? 'bg-purple-900/40 text-purple-200'
                              : 'bg-orange-900/40 text-orange-200'
                            : 'text-zinc-400'
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
            <div className="px-4 py-2 text-xs uppercase font-bold text-zinc-400 tracking-[0.2em] flex items-center gap-2 border-b border-zinc-900">
              <div
                className={`w-2 h-2 rounded-sm ${isQuantumLevel ? 'bg-purple-900' : 'bg-zinc-800'}`}
              />
              Preview
              {selectedCandidate && (
                <span className="text-xs font-normal text-zinc-400 truncate max-w-[45%]">
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
                <div className="text-zinc-400 italic">
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
              <span className="text-zinc-500 italic">enter search here...</span>
            )}
          </>
        )}
        <span className="ml-auto text-xs text-zinc-400 tabular-nums">{countDisplay}</span>
      </div>
    </div>
  );
};
