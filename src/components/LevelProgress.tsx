import React, { memo, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Map, MapPin, Shield, Zap, Crown, HelpCircle, Lightbulb } from 'lucide-react';

import { Level } from '../types';
import { EPISODE_LORE } from '../constants/narrative';
import { paletteFor } from '../constants/palette';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';
import { getPlayerIdentity } from '../constants/identity';

// One token per status; a ternary chain here costs a complexity point per branch.
const TITLE_COLOR: Record<string, string> = {
  active: 'text-white',
  completed: 'text-zinc-400',
  locked: 'text-zinc-400',
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
  completed: 'text-zinc-400 hover:text-zinc-200',
  locked: 'text-zinc-400',
};

const MISSION_ICON: Record<MissionStatus, string> = {
  active: 'bg-zinc-800',
  completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
  locked: 'bg-zinc-900 text-zinc-400 border border-zinc-700',
};

const nextEpisodeTabIndex = (key: string, index: number, count: number): number | null => {
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
};

interface QuestMapMissionRowProps {
  level: Level;
  globalIdx: number;
  currentLevelIndex: number;
  isKeyboardSelected: boolean;
  episodeBorder: string;
  episodeColor: string;
  onJumpToLevel?: (levelIndex: number) => void;
  onClose: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}

const renderMissionIcon = (status: MissionStatus, levelId: number): React.ReactNode => {
  if (status === 'completed') return <Check size={14} strokeWidth={3} />;
  if (status === 'locked') return <Lock size={12} aria-hidden="true" />;
  return levelId;
};

const missionRowClasses = (
  status: MissionStatus,
  isKeyboardSelected: boolean,
  episodeBorder: string
): string => {
  const activeBorder = status === 'active' ? `bg-zinc-900/50 border-l-4 ${episodeBorder}` : '';
  const focusStyle = isKeyboardSelected
    ? 'bg-zinc-800/50 ring-2 ring-inset ring-white/20'
    : 'hover:bg-zinc-900/30';
  return `w-full text-left px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${activeBorder} ${MISSION_ROW[status]} ${focusStyle}`;
};

const QuestMapMissionRow: React.FC<QuestMapMissionRowProps> = ({
  level,
  globalIdx,
  currentLevelIndex,
  isKeyboardSelected,
  episodeBorder,
  episodeColor,
  onJumpToLevel,
  onClose,
  buttonRef,
}) => {
  const status = missionStatus(globalIdx, currentLevelIndex);
  const iconActiveClass = status === 'active' ? `${episodeColor} ${episodeBorder}` : '';

  return (
    <button
      type="button"
      disabled={status === 'locked' || !onJumpToLevel}
      aria-current={status === 'active' ? 'step' : undefined}
      ref={buttonRef}
      className={missionRowClasses(status, isKeyboardSelected, episodeBorder)}
      onClick={() => {
        if (globalIdx <= currentLevelIndex && onJumpToLevel) {
          onJumpToLevel(globalIdx);
          onClose();
        }
      }}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${MISSION_ICON[status]} ${iconActiveClass}`}
      >
        {renderMissionIcon(status, level.id)}
      </span>

      <span className="flex-1 min-w-0">
        <span
          className={`block break-words font-bold text-sm tracking-wide ${TITLE_COLOR[status]}`}
        >
          {level.title}
        </span>
        {level.coreSkill && (
          <span className="block text-xs font-mono mt-0.5 text-zinc-400">{level.coreSkill}</span>
        )}
      </span>

      {status === 'active' && (
        <span className="flex items-center gap-1 text-xs text-orange-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wider">Active</span>
        </span>
      )}
      {status === 'completed' && <Check size={16} className="text-green-500" strokeWidth={2} />}
    </button>
  );
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
  onSelectEpisode: (episodeIndex: number) => void;
  onJumpToLevel?: (levelIndex: number) => void;
  activeTab?: number;
  selectedMissionIdx?: number;
  cycleCount?: number;
}

const EPISODE_ICONS = [Zap, Shield, Crown];

const buildEpisodes = (levels: Level[]) =>
  EPISODE_LORE.map((lore, idx) => {
    const palette = paletteFor(lore.color);
    return {
      ...lore,
      levels: levels.filter((l) => l.episodeId === lore.id),
      border: palette.border,
      bg: palette.bg,
      color: palette.text,
      palette,
      icon: EPISODE_ICONS[idx] || Shield,
    };
  });

type EpisodeEntry = ReturnType<typeof buildEpisodes>[number];

const EpisodeBadges: React.FC<{ episodes: EpisodeEntry[]; completionStatus: boolean[] }> = ({
  episodes,
  completionStatus,
}) => (
  <div className="hidden sm:flex items-center gap-4 xl:gap-5 px-3 xl:px-5 border-l border-r border-zinc-800">
    {episodes.map((ep, idx) => {
      const isComplete = completionStatus[idx];
      const Icon = ep.icon;
      const palette = paletteFor(ep.color);

      return (
        <div
          key={ep.id}
          title={`${ep.shortTitle}: ${ep.name} (${isComplete ? 'Completed' : 'In progress'})`}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-700 ${isComplete ? `${palette.textStrong} scale-110` : 'text-zinc-400'}`}
          style={isComplete ? { filter: `drop-shadow(0 0 8px ${palette.textStrongHex}80)` } : {}}
        >
          <Icon size={14} fill={isComplete ? 'currentColor' : 'none'} />
          <span className="text-xs uppercase font-bold tracking-wider hidden xl:inline-block leading-none mt-0.5">
            {ep.name}
          </span>
        </div>
      );
    })}
  </div>
);

interface QuestMapModalProps {
  levels: Level[];
  episodes: EpisodeEntry[];
  activeEpisode: EpisodeEntry;
  activeTab: number;
  selectedMissionIdx: number;
  currentLevelIndex: number;
  onClose: () => void;
  onSelectEpisode: (episodeIndex: number) => void;
  onJumpToLevel?: (levelIndex: number) => void;
}

const QuestMapModal: React.FC<QuestMapModalProps> = ({
  levels,
  episodes,
  activeEpisode,
  activeTab,
  selectedMissionIdx,
  currentLevelIndex,
  onClose,
  onSelectEpisode,
  onJumpToLevel,
}) => {
  const missionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const episodeTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mapRef = useOverlayFocus(true);

  useEffect(() => {
    missionRefs.current[selectedMissionIdx]?.scrollIntoView({ block: 'nearest' });
  }, [selectedMissionIdx, activeTab]);

  const handleEpisodeTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const nextIndex = nextEpisodeTabIndex(event.key, index, episodes.length);
    if (nextIndex === null) return;
    event.preventDefault();
    onSelectEpisode(nextIndex);
    episodeTabRefs.current[nextIndex]?.focus();
  };

  return createPortal(
    <div
      data-testid="quest-map-modal"
      className="fixed inset-x-0 bottom-0 top-14 z-[250] flex items-center justify-center bg-black/80 px-4 pb-4 backdrop-blur-xs"
      onKeyDown={containOverlayTab}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={mapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-map-title"
        tabIndex={-1}
        className="w-full max-w-2xl max-h-full bg-zinc-950 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      >
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
              className="min-h-9 px-3 text-xs text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            h/l: episodes • j/k: missions • Enter: jump • Shift+Enter or Escape: close
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Quest Map episodes"
          className="flex border-b border-zinc-800 bg-black/50"
        >
          {episodes.map((ep, idx) => (
            <button
              key={ep.id}
              type="button"
              role="tab"
              id={`quest-map-tab-${idx}`}
              data-testid="episode-tab"
              aria-selected={activeTab === idx}
              aria-controls="quest-map-panel"
              tabIndex={activeTab === idx ? 0 : -1}
              ref={(element) => {
                episodeTabRefs.current[idx] = element;
              }}
              onClick={() => onSelectEpisode(idx)}
              onKeyDown={(event) => handleEpisodeTabKeyDown(event, idx)}
              className={`flex-1 min-w-0 px-1 py-3 break-words text-center text-xs font-bold uppercase sm:tracking-wider border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white
                      ${activeTab === idx ? `${ep.palette.textStrong} ${ep.bg} border-current` : 'text-zinc-400 border-transparent'}
                  `}
            >
              <span className="block">{ep.shortTitle}</span>
              <span className="text-xs">{ep.levels.length} Levels</span>
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {activeEpisode.title}: {activeEpisode.levels[selectedMissionIdx]?.title}
        </p>

        <div
          id="quest-map-panel"
          role="tabpanel"
          aria-labelledby={`quest-map-tab-${activeTab}`}
          tabIndex={0}
          className="flex-1 overflow-y-auto bg-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
        >
          <div className="divide-y divide-zinc-800/50">
            {activeEpisode.levels.map((level, missionIdx) => (
              <QuestMapMissionRow
                key={level.id}
                level={level}
                globalIdx={levels.findIndex((l) => l.id === level.id)}
                currentLevelIndex={currentLevelIndex}
                isKeyboardSelected={missionIdx === selectedMissionIdx}
                episodeBorder={activeEpisode.border}
                episodeColor={activeEpisode.palette.textStrong}
                onJumpToLevel={onJumpToLevel}
                onClose={onClose}
                buttonRef={(el) => {
                  missionRefs.current[missionIdx] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LevelProgressBase: React.FC<LevelProgressProps> = ({
  levels,
  currentLevelIndex,
  thought,
  onToggleHint,
  onToggleHelp,
  isOpen,
  onClose,
  onToggleMap,
  onSelectEpisode,
  onJumpToLevel,
  activeTab = 0,
  selectedMissionIdx = 0,
  cycleCount = 0,
}) => {
  const episodes = useMemo(() => buildEpisodes(levels), [levels]);

  const completionStatus = episodes.map((ep) => {
    const lastLevelOfEpisode = ep.levels[ep.levels.length - 1];
    const lastLevelGlobalIdx = levels.indexOf(lastLevelOfEpisode);
    return currentLevelIndex > lastLevelGlobalIdx;
  });

  const currentLevel = levels[currentLevelIndex];
  const currentEpisodeId = currentLevel ? currentLevel.episodeId : 1;
  const currentEpisodeIdx = currentEpisodeId - 1;

  const activeEpisode = episodes[activeTab] || episodes[0];

  return (
    <>
      <header
        data-testid="level-progress-bar"
        className="shrink-0 py-2 w-full bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto scrollbar-hide z-[300] relative"
      >
        {/* Left Side: Map Button + Current Episode Progress */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0 mr-2 min-h-9">
          <button
            type="button"
            data-testid="map-button"
            onClick={onToggleMap} // Use explicit toggle handler
            // The prop is 'onClose', but App probably passes a toggle function.
            // Let's call it onClose for now as it triggers the action, or better:
            // Since we lifted state, 'onClose' is strictly checking the prop.
            // But verify: App.tsx usually passes () => set(p => !p) for toggles.
            // Let's assume onClose is the toggle action provided by parent.
            className="flex min-h-9 px-2.5 py-1.5 items-center gap-2 rounded border border-transparent text-xs font-mono text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
            title="Quest Map (Alt+M)"
          >
            <Map
              size={16}
              className="text-zinc-400 group-hover:text-orange-500 transition-colors"
              aria-hidden="true"
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
                                ${isCurrent ? `bg-zinc-900 ${episodes[currentEpisodeIdx].border} ${episodes[currentEpisodeIdx].palette.textStrong} z-10` : ''}
                                ${isLocked ? 'bg-transparent border-transparent text-zinc-400' : ''}
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
        <div className="flex-1 min-w-0 overflow-hidden text-center px-2 sm:px-4 flex items-center justify-center">
          {thought && (
            <div
              data-testid="terminal-thought"
              className="block w-full min-w-0 max-w-full overflow-hidden whitespace-nowrap text-ellipsis font-mono text-sm animate-terminal-drop glitch-thought"
              data-message={thought.text}
              title={thought.text}
            >
              <span className="base-text block truncate">{thought.text}</span>
              <span className="white-text block truncate" aria-hidden="true">
                {thought.text}
              </span>
              <span className="orange-text block truncate" aria-hidden="true">
                {thought.text}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Trilogy Badges & Controls */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0 min-h-8 ml-auto flex-nowrap">
          {/* Prominent User Label (keeps AI identity visible) */}
          <div className="mr-2 sm:mr-4 text-right hidden lg:block">
            <span className="text-orange-400 font-mono font-bold uppercase tracking-wider text-sm">
              {`User: ${getPlayerIdentity(cycleCount)}`}
            </span>
          </div>
          {/* Badges */}
          <EpisodeBadges episodes={episodes} completionStatus={completionStatus} />

          {/* Hint & Help Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="hint-button"
              onClick={onToggleHint}
              aria-label="Show Hint (Alt+H)"
              className="flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded border border-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              title="Show Hint (Alt+H)"
            >
              <Lightbulb size={16} aria-hidden="true" />
              <span>Hint</span>
            </button>
            <button
              type="button"
              data-testid="help-button"
              onClick={onToggleHelp}
              aria-label="Show Help (Alt+?)"
              className="flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded border border-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              title="Show Help (Alt+?)"
            >
              <HelpCircle size={16} aria-hidden="true" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Legend Modal */}
      {isOpen && (
        <QuestMapModal
          levels={levels}
          episodes={episodes}
          activeEpisode={activeEpisode}
          activeTab={activeTab}
          selectedMissionIdx={selectedMissionIdx}
          currentLevelIndex={currentLevelIndex}
          onClose={onClose}
          onSelectEpisode={onSelectEpisode}
          onJumpToLevel={onJumpToLevel}
        />
      )}
    </>
  );
};

export const LevelProgress = memo(LevelProgressBase);
