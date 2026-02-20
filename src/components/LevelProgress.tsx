import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Map, MapPin, Shield, Zap, Crown, HelpCircle, Lightbulb } from 'lucide-react';

import { Level } from '../types';
import { EPISODE_LORE } from '../constants';

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
  // Lifted Props
  activeTab = 0,
  selectedMissionIdx = 0,
}) => {
  const missionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Derived Data (same as before)
  const episodeIcons = [Zap, Shield, Crown];
  const episodes = EPISODE_LORE.map((lore, idx) => {
    const color = lore.color ?? 'text-blue-500';
    return {
      ...lore,
      levels: levels.filter((l) => l.episodeId === lore.id),
      border: color.replace('text-', 'border-') + '/30',
      bg: color.replace('text-', 'bg-') + '/10',
      color,
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
    if (isOpen) {
      setTimeout(() => {
        missionRefs.current[selectedMissionIdx]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  }, [selectedMissionIdx, isOpen, activeTab]);

  return (
    <>
      <div
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
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group cursor-pointer focus:outline-none shrink-0"
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
                className={`text-[10px] uppercase font-bold tracking-widest leading-none ${episodes[currentEpisodeIdx]?.color}`}
              >
                {episodes[currentEpisodeIdx]?.shortTitle}
              </span>
            </div>

            <div className="flex items-center h-4 max-w-[200px] sm:max-w-none overflow-x-auto scrollbar-hide">
              {episodes[currentEpisodeIdx]?.levels.map((level, idx) => {
                const globalIdx = levels.indexOf(level);
                const isCompleted = globalIdx < currentLevelIndex;
                const isCurrent = globalIdx === currentLevelIndex;
                const isLocked = globalIdx > currentLevelIndex;

                // Local index 1-N for display
                const displayNum = idx + 1;

                return (
                  <div key={level.id} className="flex items-center group shrink-0">
                    {/* Connector */}
                    {idx > 0 && (
                      <div
                        className={`w-3 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-zinc-600' : 'bg-zinc-800'}`}
                      />
                    )}

                    {/* Stage Node */}
                    <div
                      className={`
                                flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[9px] font-mono transition-all duration-300
                                ${isCompleted ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : ''}
                                ${isCurrent ? `bg-zinc-900 ${episodes[currentEpisodeIdx].border} ${episodes[currentEpisodeIdx].color} shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105 z-10` : ''}
                                ${isLocked ? 'bg-transparent border-transparent text-zinc-700' : ''}
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
        <div className="flex-1 text-center px-4 flex items-center justify-center">
          {thought && (
            <div
              data-testid="narrative-thought"
              className="font-mono text-sm animate-in fade-in slide-in-from-top-1 duration-200 glitch-thought"
              data-message={thought.text}
            >
              <span className="base-text">{thought.text}</span>
              <span className="white-text">{thought.text}</span>
              <span className="orange-text">{thought.text}</span>
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
          <div className="flex items-center gap-3 sm:gap-6 px-3 sm:px-6 border-l border-r border-zinc-800">
            {episodes.map((ep, idx) => {
              const isComplete = completionStatus[idx];
              const Icon = ep.icon;

              const baseColor = ep.color.split('-')[1];
              const shadowColor =
                baseColor === 'blue'
                  ? 'rgba(96,165,250,0.5)'
                  : baseColor === 'purple'
                    ? 'rgba(192,132,252,0.5)'
                    : 'rgba(250,204,21,0.5)';

              return (
                <div
                  key={ep.id}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-700 ${isComplete ? `text-${baseColor}-400 scale-110` : 'text-zinc-600'}`}
                  style={isComplete ? { filter: `drop-shadow(0 0 8px ${shadowColor})` } : {}}
                >
                  <Icon size={14} fill={isComplete ? 'currentColor' : 'none'} />
                  <span className="text-[8px] uppercase font-bold tracking-wider hidden xl:inline-block leading-none mt-0.5">
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
      </div>

      {/* Legend Modal */}
      {isOpen &&
        createPortal(
          <div
            data-testid="quest-map-modal"
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose} // Close when clicking on the backdrop
          >
            <div
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <Map className="text-zinc-400" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                      Quest Map
                    </h2>
                  </div>
                  <div className="text-xs text-zinc-600 font-mono">
                    h/l: episodes • j/k: missions • Enter: jump • Shift+Enter or Escape: close
                  </div>
                </div>
              </div>

              {/* Episode Tabs */}
              <div className="flex border-b border-zinc-800 bg-black/50">
                {episodes.map((ep, idx) => (
                  <button
                    key={idx}
                    data-testid="episode-tab"
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex flex-col items-center gap-1
                            ${activeTab === idx ? `${ep.color} ${ep.bg} border-current` : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-zinc-900'}
                        `}
                  >
                    <span>{ep.shortTitle}</span>
                    <span className="text-[9px] opacity-60">{ep.levels.length} Levels</span>
                  </button>
                ))}
              </div>

              {/* List Content - Simple Table of Contents */}
              <div className="flex-1 overflow-y-auto bg-black/20">
                <div className="divide-y divide-zinc-800/50">
                  {activeEpisode.levels.map((level, missionIdx) => {
                    // Calculate global index to check status against currentLevelIndex
                    const globalIdx = levels.findIndex((l) => l.id === level.id);

                    const status =
                      globalIdx < currentLevelIndex
                        ? 'completed'
                        : globalIdx === currentLevelIndex
                          ? 'active'
                          : 'locked';
                    const isKeyboardSelected = missionIdx === selectedMissionIdx;

                    return (
                      <div
                        key={level.id}
                        ref={(el) => {
                          missionRefs.current[missionIdx] = el;
                        }}
                        className={`
                            px-6 py-4 flex items-center gap-4 transition-all duration-200 cursor-pointer
                            ${status === 'active' ? `bg-zinc-900/50 border-l-4 ${activeEpisode.border}` : ''}
                            ${status === 'completed' ? 'opacity-50 hover:opacity-100' : ''}
                            ${status === 'locked' ? 'opacity-30' : ''}
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
                        <div
                          className={`
                                w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                ${status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                                ${status === 'active' ? `bg-zinc-800 ${activeEpisode.color} border ${activeEpisode.border}` : ''}
                                ${status === 'locked' ? 'bg-zinc-900 text-zinc-700 border border-zinc-800' : ''}
                            `}
                        >
                          {status === 'completed' ? <Check size={14} strokeWidth={3} /> : level.id}
                        </div>

                        {/* Level Title */}
                        <div className="flex-1">
                          <h3
                            className={`font-bold text-sm tracking-wide ${status === 'active' ? 'text-white' : status === 'completed' ? 'text-zinc-400' : 'text-zinc-600'}`}
                          >
                            {level.title}
                          </h3>
                          {level.coreSkill && (
                            <p className="text-xs text-zinc-600 font-mono mt-0.5">
                              {level.coreSkill}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        {status === 'active' && (
                          <div className="flex items-center gap-1 text-xs text-orange-400 font-mono">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-wider">Active</span>
                          </div>
                        )}
                        {status === 'completed' && (
                          <Check size={16} className="text-green-500" strokeWidth={2} />
                        )}
                        {status === 'locked' && <Lock size={14} className="text-zinc-700" />}
                      </div>
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
