import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

import { HELP_KEYBINDINGS, HELP_META_KEYBINDINGS } from '../constants/keybindings';
import type { Action } from '../hooks/gameReducer';
import type { GameState, Level } from '../types';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';
import { renderInlineCode } from './ui/inlineCode';

interface HelpModalProps {
  onClose: () => void;
  scrollPosition: number;
  level: Level;
  gameState: GameState;
  dispatch?: React.Dispatch<Action>;
  narrativeEffects?: 'full' | 'reduced' | 'minimal';
}

const LINE_HEIGHT = 20; // Approximate line height in pixels

const matchesFilter = (query: string, texts: string[]): boolean => {
  if (!query) return true;
  return texts.some((text) => text.toLowerCase().includes(query));
};

const groupFilteredBindings = (normalizedFilter: string) => {
  const map = new Map<string, typeof HELP_KEYBINDINGS>();
  for (const binding of HELP_KEYBINDINGS) {
    if (!matchesFilter(normalizedFilter, [binding.group, binding.description, ...binding.keys])) {
      continue;
    }
    const list = map.get(binding.group);
    if (list) list.push(binding);
    else map.set(binding.group, [binding]);
  }
  return [...map.entries()];
};

const filterCurrentTasks = (level: Level, gameState: GameState, normalizedFilter: string) =>
  level.tasks
    .filter((task) => !task.hidden || !task.hidden(gameState, level))
    .map((task) => ({
      id: task.id,
      description:
        typeof task.description === 'function'
          ? task.description(gameState, level)
          : task.description,
    }))
    .filter((task) =>
      matchesFilter(normalizedFilter, [level.title, level.coreSkill ?? '', task.description])
    );

interface CurrentLevelHelpSectionProps {
  level: Level;
  tasks: { id: string; description: string }[];
  isExpanded: boolean;
  onToggle: () => void;
}

const CurrentLevelHelpSection: React.FC<CurrentLevelHelpSectionProps> = ({
  level,
  tasks,
  isExpanded,
  onToggle,
}) => {
  if (tasks.length === 0) return null;
  return (
    <section aria-labelledby="current-level-help-heading" className="border-b border-zinc-800 pb-3">
      <h3 id="current-level-help-heading" className="text-sm font-bold text-orange-400 mb-1.5">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="current-level-help-content"
          onClick={onToggle}
          className="inline-flex min-h-9 py-1 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          Current Level
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      {isExpanded && (
        <div id="current-level-help-content">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <p className="text-xs text-zinc-300 font-mono">{level.title}</p>
            {level.coreSkill && (
              <p className="text-xs text-orange-300 font-mono">{level.coreSkill}</p>
            )}
          </div>
          <ol className="mt-1.5 list-decimal pl-4 flex flex-col gap-y-1">
            {tasks.map((task) => (
              <li key={task.id} className="text-xs text-zinc-300 font-mono leading-snug">
                {renderInlineCode(task.description)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
};

interface AccessibilitySettingsSectionProps {
  dispatch: React.Dispatch<Action>;
  narrativeEffects: 'full' | 'reduced' | 'minimal';
}

const AccessibilitySettingsSection: React.FC<AccessibilitySettingsSectionProps> = ({
  dispatch,
  narrativeEffects,
}) => (
  <div className="border-t border-zinc-800 pt-4">
    <h3 className="text-sm font-bold text-zinc-200 mb-2">Accessibility Settings</h3>
    <div className="flex flex-col gap-2">
      <label htmlFor="narrative-effects-select" className="text-sm text-zinc-400">
        Narrative Effects (glitches, screen effects)
      </label>
      <select
        id="narrative-effects-select"
        value={narrativeEffects}
        onChange={(e) => {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              narrativeEffects: e.target.value as 'full' | 'reduced' | 'minimal',
            },
          });
        }}
        className="w-full max-w-xs bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        data-testid="narrative-effects-select"
        aria-label="Select narrative effects intensity level"
      >
        <option value="full">Full (All glitches and effects)</option>
        <option value="reduced">Reduced (No background scan or automatic glitches)</option>
        <option value="minimal">Minimal (Static text and UI)</option>
      </select>
      <p className="text-xs text-zinc-400">
        Controls intensity of narrative UI effects like screen glitches and corruption
      </p>
    </div>
  </div>
);

interface HelpCommandsBodyProps {
  groups: [string, typeof HELP_KEYBINDINGS][];
  metaBindings: typeof HELP_META_KEYBINDINGS;
  hasAnyMatch: boolean;
  filterText: string;
}

const HelpCommandsBody: React.FC<HelpCommandsBodyProps> = ({
  groups,
  metaBindings,
  hasAnyMatch,
  filterText,
}) => (
  <>
    {!hasAnyMatch && (
      <p className="text-sm font-mono text-zinc-400 py-6 text-center">
        No commands match &ldquo;{filterText}&rdquo;. Press Esc to clear filter.
      </p>
    )}

    {groups.length > 0 && (
      <div>
        <h3 className="text-sm font-bold text-orange-400 mb-3">Core Yazi Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
          {groups.map(([group, bindings]) => (
            <section key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5 border-b border-zinc-800 pb-1">
                {group}
              </h4>
              <ul className="flex flex-col gap-y-1">
                {bindings.map((binding) => (
                  <li
                    key={binding.keys.join('+')}
                    className="flex items-start justify-between gap-2 text-sm p-1 rounded"
                  >
                    <span className="text-zinc-300">{binding.description}</span>
                    <span className="flex gap-1 flex-wrap justify-end shrink-0">
                      {binding.keys.map((k) => (
                        <span
                          key={k}
                          className="min-w-[24px] text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200 font-mono text-xs font-bold"
                        >
                          {k}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    )}

    {metaBindings.length > 0 && (
      <div>
        <h3 className="text-sm font-bold text-yellow-400 mb-2">Game Meta Commands</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
          {metaBindings.map((binding, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm p-1 rounded">
              <span className="text-zinc-300">{binding.description}</span>
              <div className="flex gap-1 shrink-0">
                {binding.keys.map((k) => (
                  <span
                    key={k}
                    className="min-w-9 text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200 font-mono text-xs font-bold"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
);

export const HelpModal: React.FC<HelpModalProps> = ({
  onClose,
  scrollPosition,
  level,
  gameState,
  dispatch,
  narrativeEffects = 'full',
}) => {
  const panelRef = useOverlayFocus();
  const filterInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [isCurrentLevelExpanded, setIsCurrentLevelExpanded] = useState(true);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const normalizedFilter = filter.trim().toLowerCase();

  const updateScrollCue = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, [panelRef]);

  // scrollPosition (driven by j/k/J/K from the global help-mode handler) maps to
  // the panel, which is the element that actually scrolls.
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = scrollPosition * LINE_HEIGHT;
      updateScrollCue();
    }
  }, [panelRef, scrollPosition, updateScrollCue]);

  const groups = useMemo(() => groupFilteredBindings(normalizedFilter), [normalizedFilter]);

  const metaBindings = useMemo(
    () =>
      HELP_META_KEYBINDINGS.filter((binding) =>
        matchesFilter(normalizedFilter, ['game meta', binding.description, ...binding.keys])
      ),
    [normalizedFilter]
  );
  const currentTasks = filterCurrentTasks(level, gameState, normalizedFilter);

  useEffect(() => {
    updateScrollCue();
    window.addEventListener('resize', updateScrollCue);
    return () => window.removeEventListener('resize', updateScrollCue);
  }, [
    updateScrollCue,
    groups.length,
    metaBindings.length,
    currentTasks.length,
    normalizedFilter,
    isCurrentLevelExpanded,
  ]);

  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    containOverlayTab(e);
    if (
      e.key === '/' &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLSelectElement)
    ) {
      e.preventDefault();
      filterInputRef.current?.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 top-14 z-[250] flex items-center justify-center bg-black/80 px-4 pb-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleModalKeyDown}
    >
      <div
        ref={panelRef}
        data-testid="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabIndex={-1}
        onScroll={updateScrollCue}
        className="w-full max-w-4xl md:max-w-6xl bg-zinc-900 border border-zinc-700 shadow-2xl relative max-h-[80vh] overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      >
        <div className="sticky top-0 z-10 bg-zinc-900 px-4 pt-4 pb-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <h2 id="help-modal-title" className="text-xl font-bold text-orange-500 tracking-wider">
            HELP / KEYBINDINGS
          </h2>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end min-w-48">
            <input
              ref={filterInputRef}
              type="search"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setIsCurrentLevelExpanded(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && filter) {
                  e.preventDefault();
                  e.stopPropagation();
                  setFilter('');
                }
              }}
              placeholder="Filter commands or keys (/)..."
              aria-label="Filter keybindings"
              className="w-full sm:w-64 min-h-9 bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs font-mono text-zinc-100 placeholder:text-zinc-400 focus:border-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            />
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 px-3 py-1.5 border border-zinc-700 text-xs font-bold tracking-wider text-zinc-300 hover:text-orange-400 hover:border-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 shrink-0"
              title="Close (Esc)"
            >
              CLOSE
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-6">
          <CurrentLevelHelpSection
            level={level}
            tasks={currentTasks}
            isExpanded={isCurrentLevelExpanded}
            onToggle={() => setIsCurrentLevelExpanded((expanded) => !expanded)}
          />
          <HelpCommandsBody
            groups={groups}
            metaBindings={metaBindings}
            hasAnyMatch={groups.length > 0 || metaBindings.length > 0 || currentTasks.length > 0}
            filterText={filter.trim()}
          />

          {dispatch && !normalizedFilter && (
            <AccessibilitySettingsSection dispatch={dispatch} narrativeEffects={narrativeEffects} />
          )}
        </div>

        <div className="sticky bottom-0 z-10 bg-zinc-900 px-4 py-2.5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono">
          <span>Toggle help (Alt+?) • j/k scroll • / filter • Shift+Enter or Esc to close</span>
          {hasMoreBelow && (
            <span className="text-orange-400 font-semibold">↓ More below (j/k)</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
