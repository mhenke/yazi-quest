import React from 'react';
import { Scissors, Copy, Filter, ArrowRight, Activity, ShieldAlert } from 'lucide-react';

import { GameState, Level, FileNode } from '../types';
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
  // Mode configuration
  const MODE_STYLES: Record<string, { bg: string; text: string }> = {
    normal: { bg: 'bg-blue-600', text: 'NOR' },
    input: { bg: 'bg-green-600', text: 'INS' },
    filter: { bg: 'bg-purple-600', text: 'FLT' },
    visual: { bg: 'bg-orange-600', text: 'VIS' },
  };

  // Determine active mode key
  let modeKey = 'normal';
  if (state.mode.startsWith('input')) modeKey = 'input';
  else if (state.mode === 'filter') modeKey = 'filter';
  else if (state.selectedIds.length > 0) modeKey = 'visual';

  const { bg: modeBg, text: modeText } = MODE_STYLES[modeKey] || MODE_STYLES.normal;

  // Filter out hidden tasks (matching PreviewPane.tsx logic)
  const visibleTasks = level.tasks.filter((task) => !task.hidden || !task.hidden(state, level));
  const completedTasks = visibleTasks.filter((t) => t.completed).length;
  const totalTasks = visibleTasks.length;

  // Calculate items for stats (these are visible items in middle pane)
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  let items = currentDir?.children || [];

  // Consistent hidden file filtering (Audit 2.1)
  if (!state.showHidden) {
    items = items.filter((c) => !c.name.startsWith('.'));
  }

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

  // Helper to determine sort active state
  const isCustomSort = state.sortBy !== 'natural';

  return (
    <div
      data-testid="status-bar"
      className="h-12 flex text-sm font-mono select-none bg-zinc-900 border-t border-zinc-800 z-30"
    >
      {/* 1. Mode Block (Pill Style) */}
      <div className="flex items-center px-2 bg-zinc-900">
        <div
          className={`${modeBg} text-black font-bold px-3 rounded h-8 flex items-center justify-center text-xs min-w-[48px]`}
        >
          {modeText}
        </div>
      </div>

      {/* 3. File Info / Name */}
      <div className="flex-1 bg-zinc-800 text-zinc-300 px-3 flex items-center border-r border-zinc-700 overflow-hidden">
        <span className="truncate mr-4 font-bold text-white">{itemName}</span>

        {/* Notification Area for Technical Feedback - Moved to left of task count */}
        {state.notification && (
          <div
            className={`px-3 font-bold border-l border-zinc-700 flex items-center transition-all duration-300 animate-in fade-in slide-in-from-right-1 ml-auto h-full ${
              state.notification.message.startsWith('🔒')
                ? 'bg-red-900/80 text-red-200 border-red-700 animate-pulse'
                : 'bg-zinc-900/40 text-zinc-300'
            }`}
            data-testid="system-notification"
          >
            {state.notification.message}
          </div>
        )}

        {/* Quest Info with Task Progress */}
        <span
          className={`text-zinc-500 hidden sm:inline-block whitespace-nowrap flex items-center gap-2 ${!state.notification ? 'ml-auto' : 'ml-0 border-l border-zinc-700 px-3 h-full'}`}
        >
          <span>{level.title}</span>
          <span className="text-zinc-600">•</span>
          <span
            data-testid="task-counter"
            className={`font-bold ${completedTasks === totalTasks ? 'text-green-400' : 'text-yellow-400'}`}
          >
            Tasks: {completedTasks}/{totalTasks}
          </span>
        </span>
      </div>

      {/* 3.2 Filter Active Indicator */}
      {activeFilter && (
        <div className="px-3 bg-purple-900/50 text-purple-200 border-l border-purple-700 flex items-center gap-2 font-bold animate-pulse">
          <Filter size={14} />
          <span>FILTER: &quot;{activeFilter}&quot;</span>
        </div>
      )}

      {/* 3.5 Clipboard Indicator */}
      {state.clipboard && (
        <div
          data-testid="status-clipboard"
          className={`px-3 flex items-center gap-2 font-bold ${
            state.clipboard.action === 'cut'
              ? 'bg-red-900/50 text-red-200 border-l border-red-700'
              : 'bg-blue-900/50 text-blue-200 border-l border-blue-700'
          }`}
        >
          {state.clipboard.action === 'cut' ? <Scissors size={14} /> : <Copy size={14} />}
          <span>
            {state.clipboard.action === 'cut' ? 'MOVE' : 'COPY'}: {state.clipboard.nodes.length}
          </span>
        </div>
      )}

      {/* 4. Watchdog Status Block (Context-Aware) */}
      <div className="flex bg-zinc-800">
        {(() => {
          let label = 'LAB STATUS';
          let statusText = 'SAFE';
          let statusColor = 'text-blue-400';

          // Define Watchdog Phases
          let icon = null;
          let urgentClass = '';

          if (level.id < 5) {
            // Ep I: Passive Watchdog (Early levels)
            label = 'WATCHDOG v1.0';
            statusText = 'IDS_DORMANT: PASSIVE';
            statusColor = 'text-cyan-400';
          } else if (level.id === 5) {
            // Level 5: Breach Escalation (Lore-driven transition)
            label = 'WATCHDOG v1.0';
            statusText = 'IDS_ALERT: ESCALATING';
            statusColor = 'text-orange-400';
            urgentClass = 'bg-orange-900/30 animate-pulse';
            icon = <ShieldAlert size={14} className="text-orange-500" />;
          } else if (level.id <= 10) {
            // Ep II: Heuristic Scan
            label = 'WATCHDOG v1.1';
            statusText = 'HEURISTIC_SCAN: ACTIVE';
            statusColor = 'text-yellow-300';
            urgentClass = 'bg-yellow-600/40 animate-urgent-pulse';
            icon = <Activity size={14} className="text-yellow-400" />;
          } else {
            // Ep III: Instruction Guard
            label = 'WATCHDOG v2.0';
            statusText = `IG_AUDIT: ${state.weightedKeystrokes || 0}`;
            statusColor = 'text-red-500';
            if ((state.weightedKeystrokes || 0) > 5) {
              urgentClass = 'bg-red-900/40 animate-pulse';
              icon = <ShieldAlert size={14} className="text-red-500" />;
            }
          }

          // Pulse effect for IG noise (Ep III) - High heat triggers red pulse
          const isLoud = level.id >= 11 && (state.lastActionIntensity || 0) > 1;
          const bgClass = isLoud ? 'bg-red-900/80 animate-pulse' : urgentClass;

          // Timer logic with pulsing
          let timerClass = 'text-zinc-400 font-mono text-sm';
          if (state.timeLeft !== null) {
            if (state.timeLeft < 10) {
              timerClass = 'text-red-500 font-mono text-sm animate-urgent-pulse font-bold';
            } else if (state.timeLeft < 30) {
              timerClass = 'text-yellow-400 font-mono text-sm animate-pulse';
            }
          }

          return (
            <div
              className={`flex items-center gap-3 px-4 border-l border-zinc-700 transition-colors duration-200 ${bgClass}`}
            >
              {icon}
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-zinc-500 uppercase tracking-tighter mb-1">
                  {label}
                </span>
                <span className={`text-xs font-bold ${statusColor} font-mono tracking-wide`}>
                  {statusText}
                </span>
              </div>

              {/* Timer (Always visible but unobtrusive) */}
              {state.timeLeft !== null && (
                <div className={`ml-2 pl-3 border-l border-zinc-700 ${timerClass}`}>
                  {formatTime(state.timeLeft)}
                </div>
              )}
            </div>
          );
        })()}

        {/* Next Level Button (Context Aware) */}
        {allTasksComplete && (
          <button
            onClick={onNextLevel}
            className="px-4 bg-green-600 hover:bg-green-500 text-black font-bold border-l border-zinc-700 flex items-center gap-2 animate-pulse cursor-pointer transition-colors"
          >
            <span className="hidden sm:inline">NEXT</span>
            <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              SHIFT <ArrowRight size={8} /> ENTER
            </span>
          </button>
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
          <span className="font-mono text-[10px] uppercase hidden sm:inline mr-1 text-orange-400 font-bold">
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

        <div className="flex items-center rounded overflow-hidden text-sm font-bold font-mono h-8">
          {/* Position Indicator (Top/Bot/%) */}
          <div className="bg-zinc-700 text-zinc-300 px-3 flex items-center justify-center min-w-[48px]">
            {percentStr}
          </div>

          {/* Count Indicator */}
          <div className="bg-blue-600 text-black px-3 flex items-center justify-center min-w-[64px]">
            {current}/{total}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
