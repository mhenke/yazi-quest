import React, { useEffect, useId, useRef, useMemo } from 'react';

import type { Action } from '../hooks/gameReducer';
import type { GameState } from '../types';
import { getAllDirectoriesWithPaths, resolvePath } from '../utils/fsHelpers';
import { getBaseFuzzyCandidates, filterFuzzyCandidates } from '../utils/fuzzyHelpers';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

interface FuzzyFinderProps {
  gameState: GameState;
  dispatch: React.Dispatch<Action>;
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
      return 'text-cyan-400';
    case 'archive':
      return 'text-amber-400';
    default:
      return 'text-zinc-200';
  }
};

export const FuzzyFinder: React.FC<FuzzyFinderProps> = ({ gameState, dispatch }) => {
  const isZoxide = gameState.mode === 'zoxide-jump';
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useOverlayFocus(true, 'input');
  const id = useId();
  const label = isZoxide ? 'Search directory history (zoxide)' : 'Find a file (fzf)';
  const selectedIndex = gameState.fuzzySelectedIndex ?? 0;
  const query = (gameState.inputBuffer || '').trim();

  // Specific theme for Level 7 "Quantum Tunnelling"
  const isQuantumLevel = gameState.levelIndex === 6; // Level 7 is index 6

  const accentTextClass = isQuantumLevel ? 'text-purple-300' : 'text-orange-300';

  const baseItems = useMemo(() => getBaseFuzzyCandidates(gameState), [gameState]);
  const totalCount = baseItems.length;

  const filteredCandidates = useMemo(
    () => filterFuzzyCandidates(baseItems, query),
    [baseItems, query]
  );

  const selectedCandidate = filteredCandidates[selectedIndex];
  const previewPath = isZoxide ? selectedCandidate?.path : undefined;
  const previewItems = useMemo(() => {
    if (!previewPath) return [];
    const match = getAllDirectoriesWithPaths(gameState.fs).find(
      ({ path }) => resolvePath(gameState.fs, path) === previewPath
    );
    return match?.node.children ?? [];
  }, [gameState.fs, previewPath]);

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCandidates.length]);

  const filteredCount = filteredCandidates.length;
  const currentIndex = filteredCount > 0 ? selectedIndex + 1 : 0;
  const countDisplay = isZoxide
    ? `${currentIndex}/${filteredCount || totalCount}`
    : `< ${filteredCount}/${totalCount}`;

  return (
    <div className="absolute inset-y-0 inset-x-4 z-[100] sm:inset-0" onKeyDown={containOverlayTab}>
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={`${id}-label`}
        tabIndex={-1}
        data-testid="fuzzy-finder"
        className={`flex h-full min-h-0 flex-col bg-zinc-950/95 font-mono animate-terminal-fade backdrop-blur-md ${isQuantumLevel ? 'border-2 border-purple-500/30' : 'border border-zinc-900'}`}
      >
        <div className="px-4 py-2 text-xs text-zinc-400 border-b border-zinc-900">
          <label id={`${id}-label`} htmlFor={id} className="block mb-1">
            {label}
          </label>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={`${id}-results`}
            aria-activedescendant={selectedCandidate ? `${id}-result-${selectedIndex}` : undefined}
            value={gameState.inputBuffer}
            onChange={(event) => {
              dispatch({ type: 'SET_INPUT_BUFFER', buffer: event.target.value });
              dispatch({ type: 'SET_FUZZY_INDEX', index: 0 });
            }}
            className="w-full min-w-0 bg-zinc-900 border border-zinc-600 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400"
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${isZoxide ? 'border-b border-zinc-900' : ''}`}
          >
            <div ref={listRef} id={`${id}-results`} role="listbox" aria-labelledby={`${id}-label`}>
              {filteredCandidates.map((item, idx: number) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${item.path}-${idx}`}
                    data-testid={`file-${item.path}`}
                    id={`${id}-result-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`px-4 py-2 flex items-center gap-3 text-sm ${
                      isSelected ? 'bg-zinc-900 text-white' : 'text-zinc-400'
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
                      {highlightMatch(item.path, query, accentTextClass)}
                    </span>
                  </div>
                );
              })}
            </div>
            {filteredCount === 0 && (
              <p role="status" className="p-4 text-center text-zinc-400 italic text-sm">
                No matches in {isZoxide ? 'zoxide history' : 'recursive search'}
              </p>
            )}
          </div>

          {isZoxide && (
            <div className="h-[38%] min-h-0 flex flex-col bg-zinc-950/80">
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
                    style={{
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))',
                    }}
                  >
                    {previewItems
                      .slice()
                      .sort((a, b) => {
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

        <div className="px-4 py-2 border-t border-zinc-900 flex flex-wrap gap-x-2 text-xs text-zinc-400 bg-zinc-950/90">
          <span>↑/↓ Results · Enter Select · Esc Close</span>
          <span className="ml-auto tabular-nums">{countDisplay}</span>
        </div>
      </div>
    </div>
  );
};
