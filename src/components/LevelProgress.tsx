import React, { memo, useMemo } from 'react';
import { Check, Map, MapPin, HelpCircle, Lightbulb } from 'lucide-react';

import { Level } from '../types';
import {
  buildEpisodes,
  type EpisodeEntry,
  type MissionStatus,
  missionStatus,
} from '../utils/episodes';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
  unlockedLevelIndex: number;
  thought: { text: string; author?: string } | null;
  isMapOpen?: boolean;
  onToggleHint: () => void;
  onToggleHelp: () => void;
  onToggleMap: () => void;
  onReturnFocusToFiles?: () => void;
}

const STRIP_PILL_CLASS: Record<MissionStatus, string> = {
  completed: 'bg-zinc-900/50 border-zinc-800 text-zinc-400',
  active: 'bg-zinc-900 z-10',
  available: '',
  locked: 'bg-transparent border-transparent text-zinc-400',
};

const renderStripIcon = (status: MissionStatus): React.ReactNode => {
  if (status === 'completed') return <Check size={8} strokeWidth={3} />;
  if (status === 'active') return <MapPin size={8} />;
  if (status === 'locked') return <div className="w-1 h-1 rounded-full bg-zinc-800" />;
  return null;
};

const renderStripLabel = (
  status: MissionStatus,
  title: string,
  displayNum: number
): React.ReactNode => {
  if (status === 'active') return <span className="whitespace-nowrap font-bold">{title}</span>;
  if (status !== 'locked') return <span className="font-bold">{displayNum}</span>;
  return null;
};

interface EpisodeProgressStripProps {
  episode?: EpisodeEntry;
  levels: Level[];
  currentLevelIndex: number;
  unlockedLevelIndex: number;
}

const EpisodeProgressStrip: React.FC<EpisodeProgressStripProps> = ({
  episode,
  levels,
  currentLevelIndex,
  unlockedLevelIndex,
}) => (
  <div
    className="flex items-center min-h-6 max-w-[200px] sm:max-w-none overflow-x-auto scrollbar-hide focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    role="group"
    aria-label="Levels in this episode"
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- horizontally scrollable strip must be reachable by keyboard
    tabIndex={0}
  >
    {episode?.levels.map((level, idx) => {
      const status = missionStatus(levels.indexOf(level), currentLevelIndex, unlockedLevelIndex);
      const activeAccent =
        status === 'active' ? `${episode.border} ${episode.palette.textStrong}` : '';

      return (
        <div key={level.id} className="flex items-center group shrink-0">
          {idx > 0 && (
            <div
              className={`w-3 h-[2px] mx-1 rounded-full ${status === 'completed' ? 'bg-zinc-600' : 'bg-zinc-800'}`}
            />
          )}
          <div
            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-xs font-mono transition-all duration-300 ${STRIP_PILL_CLASS[status]} ${activeAccent}`}
          >
            <div className="flex items-center justify-center">{renderStripIcon(status)}</div>
            {renderStripLabel(status, level.title, idx + 1)}
          </div>
        </div>
      );
    })}
  </div>
);

const HeaderLeftCluster: React.FC<{
  onToggleMap: () => void;
  episode: EpisodeEntry | undefined;
  levels: Level[];
  currentLevelIndex: number;
  unlockedLevelIndex: number;
}> = ({ onToggleMap, episode, levels, currentLevelIndex, unlockedLevelIndex }) => (
  <div className="flex items-center gap-3 sm:gap-5 shrink-0 mr-2 min-h-9">
    <button
      type="button"
      data-testid="map-button"
      onClick={onToggleMap}
      className="flex min-h-9 px-2.5 py-1.5 items-center gap-2 rounded border border-transparent text-xs font-mono text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors group/btn cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
      title="Quest Map (Alt+M)"
    >
      <Map
        size={16}
        className="text-zinc-400 group-hover/btn:text-orange-500 transition-colors"
        aria-hidden="true"
      />
      <span className="uppercase tracking-widest font-bold border-b border-transparent group-hover/btn:border-zinc-500">
        Map
      </span>
      <kbd
        aria-hidden="true"
        className="hidden xl:inline-block bg-zinc-900 border border-zinc-700 text-zinc-400 px-1 py-0.5 rounded-xs text-xs leading-none"
      >
        Alt+M
      </kbd>
    </button>

    <div className="h-4 w-px bg-zinc-800 shrink-0"></div>

    <div className="flex flex-col justify-center h-full">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-xs uppercase font-bold tracking-widest leading-none ${episode?.palette.textStrong}`}
        >
          {episode?.shortTitle}
        </span>
      </div>

      <EpisodeProgressStrip
        episode={episode}
        levels={levels}
        currentLevelIndex={currentLevelIndex}
        unlockedLevelIndex={unlockedLevelIndex}
      />
    </div>
  </div>
);

const ThoughtBanner: React.FC<{ thought: LevelProgressProps['thought'] }> = ({ thought }) => (
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
);

const ToolbarControls: React.FC<{ onToggleHint: () => void; onToggleHelp: () => void }> = ({
  onToggleHint,
  onToggleHelp,
}) => (
  <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-h-8 ml-auto flex-nowrap">
    <span
      aria-hidden="true"
      className="hidden group-focus-within:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-xs shrink-0"
    >
      Esc → Files
    </span>
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
        <kbd
          aria-hidden="true"
          className="hidden xl:inline-block bg-zinc-900 border border-zinc-700 text-zinc-400 px-1 py-0.5 rounded-xs text-xs leading-none"
        >
          Alt+H
        </kbd>
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
        <kbd
          aria-hidden="true"
          className="hidden xl:inline-block bg-zinc-900 border border-zinc-700 text-zinc-400 px-1 py-0.5 rounded-xs text-xs leading-none"
        >
          Alt+?
        </kbd>
      </button>
    </div>
  </div>
);

const handleToolbarEscape = (
  event: React.KeyboardEvent<HTMLElement>,
  isMapOpen: boolean,
  onReturnFocusToFiles?: () => void
) => {
  if (isMapOpen || event.key !== 'Escape' || event.defaultPrevented) return;
  event.preventDefault();
  onReturnFocusToFiles?.();
};

const LevelProgressBase: React.FC<LevelProgressProps> = ({
  levels,
  currentLevelIndex,
  unlockedLevelIndex,
  thought,
  isMapOpen = false,
  onToggleHint,
  onToggleHelp,
  onToggleMap,
  onReturnFocusToFiles,
}) => {
  const episodes = useMemo(() => buildEpisodes(levels), [levels]);
  const currentEpisodeIdx = (levels[currentLevelIndex]?.episodeId ?? 1) - 1;

  return (
    <header
      data-testid="level-progress-bar"
      onKeyDown={(e) => handleToolbarEscape(e, isMapOpen, onReturnFocusToFiles)}
      className="group shrink-0 py-2 w-full bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto scrollbar-hide z-[300] relative"
    >
      <HeaderLeftCluster
        onToggleMap={onToggleMap}
        episode={episodes[currentEpisodeIdx]}
        levels={levels}
        currentLevelIndex={currentLevelIndex}
        unlockedLevelIndex={unlockedLevelIndex}
      />
      <ThoughtBanner thought={thought} />
      <ToolbarControls onToggleHint={onToggleHint} onToggleHelp={onToggleHelp} />
    </header>
  );
};

export const LevelProgress = memo(LevelProgressBase);
