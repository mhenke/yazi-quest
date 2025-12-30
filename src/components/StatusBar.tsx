
import React from 'react';
import { GameState, Level, FileNode } from '../types';
import { Scissors, Copy, Filter, ArrowRight } from 'lucide-react';
import { getNodeByPath } from '../utils/fsHelpers';
import { getSortLabel } from '../utils/sortHelpers';

interface StatusBarProps {
  state: GameState;
  level: Level;
  allTasksComplete: boolean;
  onNextLevel: () => void;
  currentItem: FileNode | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  state,
  level,
  allTasksComplete,
  onNextLevel,
  currentItem,
}) => {
  // Yazi Style Colors
  // Normal: Blue/Cyan
  // Input: Green
  // Visual: Orange/Yellow
  // Filter: Purple

  let modeBg = 'bg-blue-600';
  let modeText = 'NOR';

  if (state.mode.startsWith('input')) {
    modeBg = 'bg-green-600';
    modeText = 'INS';
  } else if (state.mode === 'filter') {
    modeBg = 'bg-purple-600';
    modeText = 'FLT';
  } else if (state.selectedIds.length > 0) {
    modeBg = 'bg-orange-600';
    modeText = 'VIS';
  }

  const completedTasks = level.tasks.filter((t) => t.completed).length;
  const totalTasks = level.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate items for stats (these are visible items in middle pane)
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  let items = currentDir?.children || [];

  // Get active filter for current dir
  const activeFilter = currentDir ? state.filters[currentDir.id] || '' : '';

  if (activeFilter) {
    items = items.filter((c) => c.name.toLowerCase().includes(activeFilter.toLowerCase()));
  }
  const total = items.length;
  const current = total === 0 ? 0 : state.cursorIndex + 1;
  const itemName = currentItem ? currentItem.name : '';

  // Permissions logic
  const isDir = currentItem?.type === 'dir' || currentItem?.type === 'archive';
  const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';

  // Position logic (Top/Bot/%)
  let percentStr = 'Top';
  if (total > 0) {
    if (state.cursorIndex === 0) percentStr = 'Top';
    else if (state.cursorIndex >= total - 1) percentStr = 'Bot';
    else percentStr = `${Math.round((current / total) * 100)}%`;
  }

  // Timer formatting
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = state.timeLeft !== null && state.timeLeft <= 10;

  // Keystroke logic
  const showKeystrokes = level.maxKeystrokes !== undefined;
  const isHighKeystrokes = showKeystrokes && state.keystrokes >= level.maxKeystrokes! * 0.9;

  // Helper to determine sort active state
  const isCustomSort = state.sortBy !== 'natural';

  return (
    <div className="h-6 flex text-xs font-mono select-none bg-zinc-900 border-t border-zinc-800 z-30">
      {/* 1. Mode Block (Pill Style) */}
      <div className="flex items-center px-2 bg-zinc-900">
        <div
          className={`${modeBg} text-black font-bold px-2 rounded h-4 flex items-center justify-center text-[10px] min-w-[36px]`}
        >
          {modeText}
        </div>
      </div>

      {/* 3. File Info / Name */}
      <div className="flex-1 bg-zinc-800 text-zinc-300 px-3 flex items-center border-r border-zinc-700 overflow-hidden">
        <span className="truncate mr-4 font-bold text-white">{itemName}</span>

        {/* Quest Info with Task Progress */}
        <span className="text-zinc-500 hidden sm:inline-block whitespace-nowrap ml-auto flex items-center gap-2">
          <span
            className={`font-bold ${completedTasks === totalTasks ? 'text-green-400' : 'text-yellow-400'}`}
          >
            Tasks: {completedTasks}/{totalTasks}
          </span>
          <span className="text-zinc-600">•</span>
          <span>{level.title}</span>
        </span>
      </div>

      {/* 3.2 Filter Active Indicator */}
      {activeFilter && (
        <div className="px-3 bg-purple-900/50 text-purple-200 border-l border-purple-700 flex items-center gap-2 font-bold animate-pulse">
          <Filter size={10} />
          <span>FILTER: "{activeFilter}"</span>
        </div>
      )}

      {/* 3.5 Clipboard Indicator */}
      {state.clipboard && (
        <div
          className={`px-3 flex items-center gap-2 font-bold ${
            state.clipboard.action === 'cut'
              ? 'bg-red-900/50 text-red-200 border-l border-red-700'
              : 'bg-blue-900/50 text-blue-200 border-l border-blue-700'
          }`}
        >
          {state.clipboard.action === 'cut' ? <Scissors size={10} /> : <Copy size={10} />}
          <span>
            {state.clipboard.action === 'cut' ? 'MOVE' : 'COPY'}: {state.clipboard.nodes.length}
          </span>
        </div>
      )}

      {/* 4. Timer / Metrics (Right Aligned) */}
      <div className="flex bg-zinc-800">
        {/* Level Complete Trigger */}
        {allTasksComplete ? (
          <>
            {level.successMessage && (
              <div className="px-3 bg-green-950/50 text-green-400 font-bold border-l border-green-700 flex items-center text-[10px] uppercase tracking-wide">
                {level.successMessage}
              </div>
            )}
            <button
              onClick={onNextLevel}
              className="px-4 bg-green-600 hover:bg-green-500 text-black font-bold border-l border-zinc-700 flex items-center gap-2 animate-pulse cursor-pointer transition-colors"
            >
              <span className="hidden sm:inline">NEXT</span>
              <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                SHIFT <ArrowRight size={8} /> ENTER
              </span>
            </button>
          </>
        ) : (
          state.notification && (
            <div
              className={`px-3 font-bold border-l border-zinc-700 flex items-center italic max-w-[400px] truncate ${
                state.notification.startsWith('🔒')
                  ? 'bg-red-900/80 text-red-200 border-red-700 animate-pulse'
                  : 'bg-zinc-800 text-yellow-400'
              }`}
            >
              {state.notification}
            </div>
          )
        )}

        {/* Show Timer if active */}
        {state.timeLeft !== null && !showKeystrokes && !allTasksComplete && (
          <div
            className={`px-4 py-0.5 font-bold border-l border-zinc-700 flex items-center gap-2 transition-colors ${
              isLowTime
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-red-900/80 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
            }`}
          >
            <span className="hidden sm:inline text-[10px] opacity-90 uppercase tracking-widest">
              Time:
            </span>
            <span className="font-mono text-sm">{formatTime(state.timeLeft)}</span>
          </div>
        )}

        {/* Show Keystrokes if Mastery Level */}
        {showKeystrokes && (
          <div
            className={`px-3 font-bold border-l border-zinc-700 flex items-center gap-2 ${isHighKeystrokes ? 'text-red-500 bg-red-950/30' : 'text-yellow-500'}`}
          >
            <span className="hidden sm:inline text-[10px] opacity-70">KEYS:</span>
            <span className="font-mono text-sm">
              {state.keystrokes}/{level.maxKeystrokes}
            </span>
          </div>
        )}
      </div>

      {/* 5. Stats Block (Yazi Style) */}
      <div className="bg-zinc-900 px-3 flex items-center gap-3 border-l border-zinc-800">
        
        {/* Hidden Files Indicator */}
        <span
          className={`font-mono text-[10px] uppercase hidden sm:inline mr-2 ${state.showHidden ? 'text-yellow-400 font-bold' : 'text-zinc-600'}`}
        >
          {state.showHidden ? 'HIDDEN: ON' : 'HIDDEN: OFF'}
        </span>

        {/* Sort Indicator - Only show if custom */}
        {isCustomSort && (
          <span
            className="font-mono text-[10px] uppercase hidden sm:inline mr-1 text-orange-400 font-bold"
          >
            {getSortLabel(state.sortBy, state.sortDirection)}
          </span>
        )}

        {/* Linemode Indicator - NEW */}
        {state.linemode !== 'none' && (
          <span className="font-mono text-[10px] uppercase text-blue-400 hidden sm:inline mr-1">
            {state.linemode}
          </span>
        )}

        <span className="text-zinc-500 font-mono hidden md:inline">{perms}</span>

        <div className="flex items-center rounded overflow-hidden text-xs font-bold font-mono h-4">
          {/* Position Indicator (Top/Bot/%) */}
          <div className="bg-zinc-700 text-zinc-300 px-2 flex items-center justify-center min-w-[36px]">
            {percentStr}
          </div>

          {/* Count Indicator */}
          <div className="bg-blue-600 text-black px-2 flex items-center justify-center min-w-[48px]">
            {current}/{total}
          </div>
        </div>
      </div>
    </div>
  );
};
