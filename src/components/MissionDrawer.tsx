import React from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { Level, GameState } from '../types';

interface MissionDrawerProps {
  level: Level;
  gameState: GameState;
  isExpanded: boolean;
  onToggle: () => void;
}

export const MissionDrawer: React.FC<MissionDrawerProps> = ({
  level,
  gameState,
  isExpanded,
  onToggle,
}) => {
  const completedTaskIds = gameState.completedTaskIds[level.id] || [];
  const visibleTasks = level.tasks.filter((task) => !task.hidden || !task.hidden(gameState, level));
  const completedCount = visibleTasks.filter((t) => completedTaskIds.includes(t.id)).length;
  const totalCount = visibleTasks.length;

  if (!isExpanded) {
    return (
      <div className="border-t border-zinc-800 bg-zinc-900 shrink-0 select-none">
        <button
          onClick={onToggle}
          className="h-8 px-3 py-1.5 w-full flex items-center justify-between text-left hover:bg-zinc-850 transition-colors cursor-pointer group"
          aria-label="Expand mission drawer (Alt+O)"
          title="Expand mission drawer (Alt+O)"
        >
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-orange-500 font-bold uppercase tracking-wider">
              MISSION LOG: LVL {level.id}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 truncate max-w-48">{level.title}</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-400 text-xs hidden sm:inline">
              {completedCount}/{totalCount} Tasks
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white font-mono text-xs">
            <span className="text-xs text-zinc-400 hidden sm:inline">EXPAND</span>
            <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-sm text-xs">
              Alt+O
            </span>
            <ChevronUp size={14} />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="h-2/5 max-h-80 min-h-40 border-t border-zinc-800 bg-zinc-900/40 flex flex-col shrink-0 transition-all duration-200">
      <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0 select-none">
        <h1 className="text-xs font-bold text-orange-500 uppercase tracking-wider font-mono flex items-center gap-2">
          <span>Mission Log: LVL {level.id}</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-300 normal-case font-normal truncate max-w-48 hidden sm:inline">
            {level.title}
          </span>
        </h1>
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-mono text-xs px-2 py-0.5 rounded-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Collapse mission drawer to maximize file preview (Alt+O)"
          title="Collapse mission drawer (Alt+O)"
        >
          <span className="text-xs text-zinc-400 hidden sm:inline">COLLAPSE</span>
          <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-sm text-xs">Alt+O</span>
          <ChevronDown size={14} />
        </button>
      </div>
      <div
        className="p-3.5 overflow-y-auto space-y-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        role="region"
        aria-label="Mission log"
      >
        <div>
          <h2 className="text-xs uppercase font-bold text-zinc-400 mb-1 tracking-widest">Target</h2>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed mission-prose">
            {level.description}
          </p>
        </div>
        <div>
          <h2 className="text-xs uppercase font-bold text-zinc-400 mb-2 tracking-widest">
            Objectives
          </h2>
          <div className="space-y-2">
            {visibleTasks.map((task) => {
              const isTaskCompleted = completedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`flex gap-3 items-start transition-all duration-500 ${isTaskCompleted ? 'text-zinc-400' : 'text-zinc-300'}`}
                >
                  <div
                    className={`mt-0.5 shrink-0 ${isTaskCompleted ? 'text-green-500' : 'text-zinc-400'}`}
                  >
                    {isTaskCompleted ? <CheckSquare size={14} /> : <Square size={14} />}
                  </div>
                  <div
                    className={`text-xs font-mono leading-snug mission-prose ${isTaskCompleted ? 'line-through text-zinc-500 decoration-zinc-600' : 'text-zinc-300'}`}
                  >
                    {typeof task.description === 'function'
                      ? task.description(gameState, level)
                      : task.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
