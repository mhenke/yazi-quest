import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Map, MapPin, Shield, Zap, Crown, HelpCircle, Lightbulb } from 'lucide-react';

import { Level } from '../types';
import { EPISODE_LORE } from '../constants/narrative';
import { paletteFor } from '../constants/palette';
import { useOverlayFocus } from './useOverlayFocus';

// One token per status; a ternary chain here costs a complexity point per branch.
const TITLE_COLOR: Record<string, string> = {
  active: 'text-white',
  completed: 'text-zinc-400',
  locked: 'text-zinc-600',
};

type MissionStatus = 'active' | 'completed' | 'locked';

const missionStatus = (globalIdx: number, currentLevelIndex: number): MissionStatus =>
  globalIdx < currentLevelIndex
    ? 'completed'
    : globalIdx === currentLevelIndex
      ? 'active'
      : 'locked';

const MISSION_ROW: Record<MissionStatus, string> = {
  active: 'text-white',
  completed: 'text-zinc-500 hover:text-zinc-300',
  locked: 'opacity-30',
};

const MISSION_ICON: Record<MissionStatus, string> = {
  active: 'bg-zinc-800',
  completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
  locked: 'bg-zinc-900 text-zinc-700 border border-zinc-800',
};

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
  notification: { message: string; isThought?: boolean; author?: string } | null;
  thought: { text: string; author?: string } | null;
  onToggleHint: () => void;
  onToggleHelp: () => void;
  isOpen: boolean;
  onClose: () => void;

  onToggleMap: () => void;
  onJumpToLevel?: (levelIndex: number) => void;
  activeTab?: number;
  selectedMissionIdx?: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
  levels,
  currentLevelIndex,
  thought,
  onToggleHint,
  onToggleHelp,
  isOpen,
  onClose,
  onToggleMap,
  onJumpToLevel,
  activeTab = 0,
  selectedMissionIdx = 0,
}) => {
  const missionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mapRef = useOverlayFocus(isOpen);

  const episodeIcons = [Zap, Shield, Crown];
  const episodes = EPISODE_LORE.map((lore, idx) => {
    const palette = paletteFor(lore.color);
    return {
      ...lore,
      levels: levels.filter((l) => l.episodeId === lore.id),
      border: palette.border,
      bg: palette.bg,
      color: palette.text,
      palette,
      icon: episodeIcons[idx] || Shield,
    };
  });

  const completionStatus = episodes.map((ep) => {
    const lastLevelOfEpisode = ep.levels[ep.levels.length - 1];
    const lastLevelGlobalIdx = levels.indexOf(lastLevelOfEpisode);
    return currentLevelIndex > lastLevelGlobalIdx;
  });

  const currentLevel = levels[currentLevelIndex];
  const currentEpisodeId = currentLevel ? currentLevel.episodeId : 1;
  const currentEpisodeIdx = currentEpisodeId - 1;

  const activeEpisode = episodes[activeTab] || episodes[0];

  // Auto-scroll to selected mission
  useEffect(() => {
    if (isOpen) missionRefs.current[selectedMissionIdx]?.scrollIntoView({ block: 'nearest' });
  }, [selectedMissionIdx, isOpen, activeTab]);

  return (
    <>
      <header
        data-testid="level-progress-bar"
        className="w-full bg-black/50 border-b border-zinc-800 py-3 px-4 sm:px-6 flex items-center justify-between backdrop-blur-sm z-[300] relative"
      >
        {/* Left Side: Map Button + Current Episode Progress */}
        <div className="flex items-center gap-3 sm:gap-6 overflow-hidden mr-4 h-8">
          <button
            data-testid="map-button"
            onClick={onToggleMap} // Use explicit toggle handler
            // The prop is 'onClose', but App probably passes a toggle function.
            // Let's call it onClose for now as it triggers the action, or better:
            // Since we lifted state, 'onClose' is strictly checking the prop.
            // But verify: App.tsx usually passes () => set(p => !p) for toggles.
            // Let's assume onClose is the toggle action provided by parent.
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
            title="Quest Map (Alt+M)"
          >
            <Map
              size={16}
              className="text-zinc-400 group-hover:text-orange-500 transition-colors"
            />
            <span className="uppercase tracking-widest font-bold border-b border-transparent group-hover:border-zinc-500">
              Map
            </span>
          </button>

          <div className="h-4 w-px bg-zinc-800 shrink-0"></div>

          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs uppercase font-bold tracking-widest leading-none ${episodes[currentEpisodeIdx]?.palette.textStrong}`}
              >
                {episodes[currentEpisodeIdx]?.shortTitle}
              </span>
            </div>

            <div
              className="flex items-center h-4 max-w-[200px] sm:max-w-none overflow-x-auto scrollbar-hide focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              role="group"
              aria-label="Levels in this episode"
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- horizontally scrollable strip must be reachable by keyboard
              tabIndex={0}
            >
              {episodes[currentEpisodeIdx]?.levels.map((level, idx) => {
                const globalIdx = levels.indexOf(level);
                const isCompleted = globalIdx < currentLevelIndex;
                const isCurrent = globalIdx === currentLevelIndex;
                const isLocked = globalIdx > currentLevelIndex;

                const displayNum = idx + 1;

                return (
                  <div key={level.id} className="flex items-center group shrink-0">
                    {idx > 0 && (
                      <div
                        className={`w-3 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-zinc-600' : 'bg-zinc-800'}`}
                      />
                    )}

                    <div
                      className={`
                                flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-xs font-mono transition-all duration-300
                                ${isCompleted ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : ''}
                                ${isCurrent ? `bg-zinc-900 ${episodes[currentEpisodeIdx].border} ${episodes[currentEpisodeIdx].palette.textStrong} shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105 z-10` : ''}
                                ${isLocked ? 'bg-transparent border-transparent text-zinc-500' : ''}
                            `}
                    >
                      <div className="flex items-center justify-center">
                        {isCompleted && <Check size={8} strokeWidth={3} />}
                        {isCurrent && <MapPin size={8} className="animate-pulse" />}
                        {isLocked && <div className="w-1 h-1 rounded-full bg-zinc-800" />}
                      </div>

                      {isCurrent && (
                        <span className="whitespace-nowrap font-bold">{level.title}</span>
                      )}
                      {!isCurrent && !isLocked && <span className="font-bold">{displayNum}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Center: Notification Area (Thoughts only) */}
        <div className="flex-1 min-w-0 text-center px-2 sm:px-4 flex items-center justify-center">
          {thought && (
            <div
              data-testid="terminal-thought"
              className="font-mono text-sm animate-in fade-in slide-in-from-top-1 duration-200 glitch-thought max-sm:!w-full max-sm:!overflow-hidden max-sm:whitespace-nowrap"
              data-message={thought.text}
              title={thought.text}
            >
              <span className="base-text max-sm:truncate">{thought.text}</span>
              <span className="white-text max-sm:truncate" aria-hidden="true">
                {thought.text}
              </span>
              <span className="orange-text max-sm:truncate" aria-hidden="true">
                {thought.text}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Trilogy Badges & Controls */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0 h-8">
          {/* Prominent User Label (keeps AI identity visible) */}
          <div className="mr-2 sm:mr-4 text-right hidden lg:block">
            <span className="text-orange-400 font-mono font-bold uppercase tracking-wider text-sm">
              User: AI-7734
            </span>
          </div>
          {/* Badges */}
          <div className="hidden sm:flex items-center gap-6 px-6 border-l border-r border-zinc-800">
            {episodes.map((ep, idx) => {
              const isComplete = completionStatus[idx];
              const Icon = ep.icon;
              const palette = paletteFor(ep.color);

              return (
                <div
                  key={ep.id}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-700 ${isComplete ? `${palette.textStrong} scale-110` : 'text-zinc-400'}`}
                  style={
                    isComplete ? { filter: `drop-shadow(0 0 8px ${palette.textStrongHex}80)` } : {}
                  }
                >
                  <Icon size={14} fill={isComplete ? 'currentColor' : 'none'} />
                  <span className="text-xs uppercase font-bold tracking-wider hidden xl:inline-block leading-none mt-0.5">
                    {ep.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hint & Help Controls */}
          <div className="flex items-center gap-2">
            <button
              data-testid="hint-button"
              onClick={onToggleHint}
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition-colors border border-transparent hover:border-zinc-700"
              title="Show Hint (Alt+H)"
            >
              <Lightbulb size={20} />
            </button>
            <button
              data-testid="help-button"
              onClick={onToggleHelp}
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors border border-transparent hover:border-zinc-700"
              title="Show Help (Alt+?)"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Legend Modal */}
      {isOpen &&
        createPortal(
          <div
            data-testid="quest-map-modal"
            className="fixed inset-x-0 bottom-0 top-16 z-[250] flex items-center justify-center bg-black/80 px-4 pb-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            <div
              ref={mapRef}
              role="dialog"
              aria-labelledby="quest-map-title"
              tabIndex={-1}
              className="w-full max-w-2xl max-h-full bg-zinc-950 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden outline-none"
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-3 justify-between flex-wrap">
                  <div className="flex items-center gap-3">
                    <Map className="text-zinc-400" size={20} />
                    <h2
                      id="quest-map-title"
                      className="text-xl font-bold text-white tracking-widest uppercase"
                    >
                      Quest Map
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-6 px-2 text-xs text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-400 font-mono">
                  h/l: episodes • j/k: missions • Enter: jump • Shift+Enter or Escape: close
                </p>
              </div>

              {/* Episode Tabs */}
              <div className="flex border-b border-zinc-800 bg-black/50">
                {episodes.map((ep, idx) => (
                  <span
                    key={idx}
                    data-testid="episode-tab"
                    aria-current={activeTab === idx ? 'true' : undefined}
                    className={`flex-1 min-w-0 px-1 py-3 break-words text-center text-[11px] sm:text-xs font-bold uppercase sm:tracking-wider border-b-2
                            ${activeTab === idx ? `${ep.palette.textStrong} ${ep.bg} border-current` : 'text-zinc-400 border-transparent'}
                        `}
                  >
                    <span className="block">{ep.shortTitle}</span>
                    <span className="text-xs">{ep.levels.length} Levels</span>
                  </span>
                ))}
              </div>
              <p className="sr-only" aria-live="polite">
                {activeEpisode.title}: {activeEpisode.levels[selectedMissionIdx]?.title}
              </p>

              {/* List Content - Simple Table of Contents */}
              <div className="flex-1 overflow-y-auto bg-black/20">
                <div className="divide-y divide-zinc-800/50">
                  {activeEpisode.levels.map((level, missionIdx) => {
                    // Calculate global index to check status against currentLevelIndex
                    const globalIdx = levels.findIndex((l) => l.id === level.id);
                    const status = missionStatus(globalIdx, currentLevelIndex);
                    const isKeyboardSelected = missionIdx === selectedMissionIdx;

                    return (
                      <button
                        type="button"
                        disabled={status === 'locked' || !onJumpToLevel}
                        aria-current={status === 'active' ? 'step' : undefined}
                        key={level.id}
                        ref={(el) => {
                          missionRefs.current[missionIdx] = el;
                        }}
                        className={`
                            w-full text-left px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white
                            ${status === 'active' ? `bg-zinc-900/50 border-l-4 ${activeEpisode.border}` : ''}
                            ${MISSION_ROW[status]}
                            ${isKeyboardSelected ? 'bg-zinc-800/50 ring-2 ring-inset ring-white/20' : 'hover:bg-zinc-900/30'}
                            `}
                        onClick={() => {
                          if (globalIdx <= currentLevelIndex && onJumpToLevel) {
                            onJumpToLevel(globalIdx);
                            onClose();
                          }
                        }}
                      >
                        {/* Status Icon */}
                        <span
                          className={`
                                w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                ${MISSION_ICON[status]}
                                ${status === 'active' ? `${activeEpisode.color} ${activeEpisode.border}` : ''}
                            `}
                        >
                          {status === 'completed' ? <Check size={14} strokeWidth={3} /> : level.id}
                        </span>

                        {/* Level Title */}
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block break-words font-bold text-sm tracking-wide ${TITLE_COLOR[status]}`}
                          >
                            {level.title}
                          </span>
                          {level.coreSkill && (
                            <span
                              className={`block text-xs font-mono mt-0.5 ${status === 'locked' ? 'text-zinc-600' : 'text-zinc-400'}`}
                            >
                              {level.coreSkill}
                            </span>
                          )}
                        </span>

                        {/* Status Badge */}
                        {status === 'active' && (
                          <span className="flex items-center gap-1 text-xs text-orange-400 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            <span className="text-xs uppercase tracking-wider">Active</span>
                          </span>
                        )}
                        {status === 'completed' && (
                          <Check size={16} className="text-green-500" strokeWidth={2} />
                        )}
                        {status === 'locked' && <Lock size={14} className="text-zinc-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
