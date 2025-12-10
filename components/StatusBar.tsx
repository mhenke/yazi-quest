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
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="h-8 flex text-xs font-mono select-none">
      {/* Mode Indicator */}
      <div className={`${modeColor} text-black font-bold px-3 flex items-center`}>
        {modeText}
      </div>
      
      {/* Path */}
      <div className="bg-zinc-800 text-zinc-300 px-3 flex items-center border-r border-zinc-700">
        path: /{state.currentPath.slice(1).join('/')}
      </div>

      {/* Level Info */}
      <div className="bg-zinc-900 text-zinc-400 px-3 flex items-center flex-1 border-r border-zinc-700 gap-4">
        <span className="text-yellow-500 font-bold">Lvl {level.id}: {level.title}</span>
        <span className={allTasksComplete ? 'text-green-500' : 'text-zinc-500'}>
            Tasks: {completedTasks}/{totalTasks} ({progress}%)
        </span>
      </div>

      {/* Notification Area */}
      <div className="bg-zinc-800 text-zinc-300 px-3 flex items-center justify-end min-w-[200px]">
         {state.notification || "Press '?' for help"}
      </div>

       {/* Percentage */}
       <div className="bg-zinc-700 text-zinc-200 px-3 flex items-center min-w-[50px] justify-center">
         Top
      </div>
    </div>
  );
};
