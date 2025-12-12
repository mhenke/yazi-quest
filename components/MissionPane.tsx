import React from 'react';
import { Level, GameState } from '../types';
import { CheckSquare, Square, HelpCircle, Lightbulb } from 'lucide-react';

interface MissionPaneProps {
  level: Level;
  gameState: GameState;
  onToggleHint: () => void;
  onToggleHelp: () => void;
}

export const MissionPane: React.FC<MissionPaneProps> = ({ level, gameState, onToggleHint, onToggleHelp }) => {
  return (
    <div className="w-64 bg-black border-r border-zinc-800 flex flex-col text-zinc-300 shrink-0 z-20">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-1">
          Mission Log
        </h2>
        <div className="text-xs text-zinc-500 font-mono">
          Level {level.id} // {level.title}
        </div>
        {level.coreSkill && (
          <div className="mt-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
            SKILL: {level.coreSkill}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2 tracking-widest">
            Briefing
          </h3>
          <p className="text-xs leading-relaxed text-zinc-400 font-mono">
            {level.description}
          </p>
        </div>

        {level.environmentalClue && (
          <div className="bg-yellow-950/20 border border-yellow-900/30 rounded p-3">
            <h3 className="text-[10px] uppercase font-bold text-yellow-600 mb-1 tracking-widest">
              Intel
            </h3>
            <p className="text-[10px] font-mono text-yellow-500/80 leading-relaxed">
              {level.environmentalClue}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2 tracking-widest">
            Objectives
          </h3>
          <div className="space-y-3">
            {level.tasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex gap-3 items-start transition-opacity duration-500 ${task.completed ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className={`mt-0.5 shrink-0 ${task.completed ? 'text-green-500' : 'text-zinc-600'}`}>
                  {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                </div>
                <div className={`text-xs font-mono leading-tight ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                  {task.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 space-y-2">
         <button 
           onClick={onToggleHint}
           className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded transition-colors group"
         >
           <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-yellow-500">
             <Lightbulb size={14} />
             <span>Hint</span>
           </div>
           <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 px-1 rounded bg-black">H</span>
         </button>

         <button 
           onClick={onToggleHelp}
           className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded transition-colors group"
         >
           <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-blue-500">
             <HelpCircle size={14} />
             <span>Controls</span>
           </div>
           <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 px-1 rounded bg-black">?</span>
         </button>
      </div>
    </div>
  );
};