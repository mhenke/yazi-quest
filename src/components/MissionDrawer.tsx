import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { Level, GameState } from '../types';

interface MissionDrawerProps {
  level: Level;
  gameState: GameState;
  isExpanded: boolean;
  onToggle: () => void;
}

const renderInlineCode = (text: string): React.ReactNode =>
  text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={index} className="rounded-sm bg-zinc-800 px-1 text-amber-200">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );

interface MissionTaskRowProps {
  description: string;
  isCompleted: boolean;
  isNext: boolean;
}

const MissionTaskRow: React.FC<MissionTaskRowProps> = ({ description, isCompleted, isNext }) => (
  <li
    aria-current={isNext ? 'step' : undefined}
    className={`flex gap-3 items-start transition-colors ${isCompleted ? 'text-zinc-400' : 'text-zinc-300'} ${isNext ? 'border border-orange-500/40 bg-orange-500/5 px-2 py-1.5' : ''}`}
  >
    <span
      aria-hidden="true"
      className={`mt-0.5 shrink-0 ${isCompleted ? 'text-green-500' : 'text-zinc-400'}`}
    >
      {isCompleted ? <CheckSquare size={14} /> : <Square size={14} />}
    </span>
    <div className="min-w-0">
      {isNext && (
        <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-orange-400">
          NEXT
        </span>
      )}
      <div
        className={`text-xs font-mono leading-snug mission-prose ${isCompleted ? 'line-through text-zinc-400 decoration-zinc-500' : 'text-zinc-300'}`}
      >
        {renderInlineCode(description)}
      </div>
    </div>
  </li>
);

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
  const nextTask = visibleTasks.find((task) => !completedTaskIds.includes(task.id));
  const taskListRef = useRef<HTMLDivElement>(null);
  const [remainingTasks, setRemainingTasks] = useState(0);
  const updateOverflowCue = useCallback(() => {
    const list = taskListRef.current;
    if (!list) return;
    const { bottom } = list.getBoundingClientRect();
    setRemainingTasks(
      Array.from(list.querySelectorAll('li')).filter(
        (item) => item.getBoundingClientRect().bottom > bottom + 1
      ).length
    );
  }, []);

  useEffect(() => {
    updateOverflowCue();
    window.addEventListener('resize', updateOverflowCue);
    return () => window.removeEventListener('resize', updateOverflowCue);
  }, [updateOverflowCue, visibleTasks.length]);

  if (!isExpanded) {
    return (
      <div className="border-t border-zinc-800 bg-zinc-900 shrink-0 select-none">
        <h1 className="sr-only">
          Mission Log: LVL {level.id} — {level.title}
        </h1>
        <button
          onClick={onToggle}
          className="h-8 px-3 py-1.5 w-full flex items-center justify-between text-left hover:bg-zinc-800 transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          aria-label="Expand mission drawer (Alt+O)"
          title="Expand mission drawer (Alt+O)"
        >
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-orange-500 font-bold uppercase tracking-wider">
              MISSION LOG: LVL {level.id}
            </span>
            <span className="text-zinc-600 hidden xl:inline">•</span>
            <span className="hidden max-w-48 truncate text-zinc-300 xl:inline">{level.title}</span>
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
    <div className="h-1/2 max-h-96 min-h-40 border-t border-zinc-800 bg-zinc-900/40 flex flex-col shrink-0 transition-all duration-200">
      <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0 select-none">
        <h1
          aria-label={`Mission Log: LVL ${level.id} — ${level.title}`}
          className="text-base font-bold text-orange-500 uppercase tracking-wider font-mono flex items-center gap-2 min-w-0"
        >
          <span className="shrink-0">LVL {level.id}</span>
          <span className="hidden xl:inline min-w-0 truncate text-xs text-zinc-300 normal-case font-normal">
            — {level.title}
          </span>
        </h1>
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-mono text-xs px-2 py-0.5 rounded-sm hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Collapse mission drawer to maximize file preview (Alt+O)"
          title="Collapse mission drawer (Alt+O)"
        >
          <span className="text-xs text-zinc-400 hidden sm:inline">COLLAPSE</span>
          <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-sm text-xs">Alt+O</span>
          <ChevronDown size={14} />
        </button>
      </div>
      <div
        className="min-h-0 flex-1 p-3.5 flex flex-col gap-3"
        role="region"
        aria-label="Mission log"
      >
        <div>
          <h2 className="text-xs uppercase font-bold text-zinc-400 mb-1 tracking-widest">Target</h2>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed mission-prose">
            {renderInlineCode(level.description ?? '')}
          </p>
        </div>
        <div className="min-h-0 flex-1 flex flex-col">
          <h2 className="text-xs uppercase font-bold text-zinc-400 mb-2 tracking-widest">
            Objectives
          </h2>
          <div className="relative min-h-0 flex-1">
            <div
              ref={taskListRef}
              role="region"
              aria-label="Mission objectives"
              tabIndex={0}
              onScroll={updateOverflowCue}
              className="relative h-full overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <ol className="list-none space-y-2">
                {visibleTasks.map((task) => (
                  <MissionTaskRow
                    key={task.id}
                    description={
                      typeof task.description === 'function'
                        ? task.description(gameState, level)
                        : task.description
                    }
                    isCompleted={completedTaskIds.includes(task.id)}
                    isNext={task.id === nextTask?.id}
                  />
                ))}
              </ol>
              {remainingTasks > 0 && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-zinc-900 to-transparent"
                  />
                  <span
                    role="status"
                    className="pointer-events-none absolute bottom-1 right-2 text-xs text-orange-300 font-mono"
                  >
                    ↓ {remainingTasks} more
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
