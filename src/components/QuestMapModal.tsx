import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Map } from 'lucide-react';

import { Level } from '../types';
import { type EpisodeEntry, type MissionStatus, missionStatus } from '../utils/episodes';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

const TITLE_COLOR: Record<string, string> = {
  active: 'text-white',
  completed: 'text-zinc-400',
  available: 'text-zinc-300',
  locked: 'text-zinc-400',
};

const MISSION_ROW: Record<MissionStatus, string> = {
  active: 'text-white',
  completed: 'text-zinc-400 hover:text-zinc-200',
  available: 'text-zinc-300 hover:text-white',
  locked: 'text-zinc-400',
};

const MISSION_ICON: Record<MissionStatus, string> = {
  active: 'bg-zinc-800',
  completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
  available: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
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
  unlockedLevelIndex: number;
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

const renderMissionTrailingBadge = (status: MissionStatus): React.ReactNode => {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1 text-xs text-orange-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wider">Active</span>
      </span>
    );
  }
  if (status === 'completed') {
    return <Check size={16} className="text-green-500" strokeWidth={2} />;
  }
  return null;
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
  unlockedLevelIndex,
  isKeyboardSelected,
  episodeBorder,
  episodeColor,
  onJumpToLevel,
  onClose,
  buttonRef,
}) => {
  const status = missionStatus(globalIdx, currentLevelIndex, unlockedLevelIndex);
  const iconActiveClass = status === 'active' ? `${episodeColor} ${episodeBorder}` : '';

  return (
    <button
      type="button"
      disabled={status === 'locked' || !onJumpToLevel}
      aria-current={status === 'active' ? 'step' : undefined}
      ref={buttonRef}
      className={missionRowClasses(status, isKeyboardSelected, episodeBorder)}
      onClick={() => {
        if (status === 'locked' || !onJumpToLevel) return;
        onJumpToLevel(globalIdx);
        onClose();
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

      {renderMissionTrailingBadge(status)}
    </button>
  );
};

export interface QuestMapModalProps {
  levels: Level[];
  episodes: EpisodeEntry[];
  activeTab?: number;
  selectedMissionIdx?: number;
  currentLevelIndex: number;
  unlockedLevelIndex: number;
  onClose: () => void;
  onSelectEpisode: (episodeIndex: number) => void;
  onJumpToLevel?: (levelIndex: number) => void;
  onResetCycle?: () => void;
}

export const QuestMapModal: React.FC<QuestMapModalProps> = ({
  levels,
  episodes,
  activeTab = 0,
  selectedMissionIdx = 0,
  currentLevelIndex,
  unlockedLevelIndex,
  onClose,
  onSelectEpisode,
  onJumpToLevel,
  onResetCycle,
}) => {
  const activeEpisode = episodes[activeTab] ?? episodes[0];
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
            <div className="flex items-center gap-2">
              {onResetCycle && (
                <button
                  type="button"
                  onClick={onResetCycle}
                  className="min-h-9 px-3 text-xs text-zinc-300 hover:text-white font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Restart current cycle
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-9 px-3 text-xs text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Close
              </button>
            </div>
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
                unlockedLevelIndex={unlockedLevelIndex}
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
