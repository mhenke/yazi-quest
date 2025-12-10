import React from 'react';
import { GameState, Level } from '../types';

interface StatusBarProps {
  state: GameState;
  level: Level;
  allTasksComplete: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ state, level, allTasksComplete }) => {
  const modeColor = state.mode === 'normal' ? 'bg-green-600' : 'bg-orange-600';
  const modeText = state.mode === 'normal' ? 'NORMAL' : 'INPUT';
  
  // Calculate completion percentage
  const completedTasks = level.tasks.filter(t => t.completed).length;
  const totalTasks = level.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const selectionCount = state.selectedIds.length;

  const hasNotification = state.notification && state.notification !== "Press '?' for help";

  return (
    <div className="h-8 flex text-xs font-mono select-none bg-zinc-900 border-t border-zinc-800 z-30">
      {/* Mode Indicator */}
      <div className={`${modeColor} text-black font-bold px-3 flex items-center shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10`}>
        {modeText}
      </div>
      
      {/* Selection Indicator (Dynamic) */}
      {selectionCount > 0 && (
         <div className="bg-yellow-600 text-black font-bold px-3 flex items-center">
            VISUAL {selectionCount}
         </div>
      )}

      {/* Path */}
      <div className="bg-zinc-800 text-zinc-300 px-3 flex items-center border-r border-zinc-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
        {state.currentPath.length > 1 ? `/${state.currentPath.slice(1).join('/')}` : '/'}
      </div>

      {/* Level Info & Progress Bar Container */}
      <div className="relative flex-1 bg-zinc-900 flex items-center border-r border-zinc-700">
        {/* Progress Background */}
        <div 
            className="absolute left-0 top-0 bottom-0 bg-zinc-800 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        />
        
        {/* Text Content (on top of progress bar) */}
        <div className="relative z-10 px-4 flex items-center gap-4 w-full">
            <span className="text-yellow-500 font-bold drop-shadow-md">
                Lvl {level.id}: {level.title}
            </span>
            <span className={`drop-shadow-md ${allTasksComplete ? 'text-green-400 font-bold' : 'text-zinc-400'}`}>
                {completedTasks}/{totalTasks} Tasks
            </span>
        </div>
      </div>

      {/* Notification Area - Improved Visibility */}
      <div className={`
          px-3 flex items-center justify-end min-w-[300px] truncate border-l border-zinc-700 transition-colors duration-300
          ${hasNotification ? 'bg-yellow-900/40 text-yellow-300 font-bold' : 'bg-zinc-800 text-zinc-500 italic'}
      `}>
         {state.notification || "Press '?' for help"}
      </div>

       {/* Position */}
       <div className="bg-zinc-700 text-zinc-200 px-3 flex items-center min-w-[60px] justify-center text-[10px]">
         {(state.cursorIndex + 1)}:{state.cursorIndex + 1}
      </div>
    </div>
  );
};