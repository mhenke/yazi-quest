import React from 'react';
import { Level } from '../types';
import { Check, Lock, MapPin, ChevronRight } from 'lucide-react';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels, currentLevelIndex }) => {
  return (
    <div className="w-full bg-black/50 border-b border-zinc-800 py-3 px-6 flex items-center gap-2 overflow-x-auto select-none backdrop-blur-sm z-10 relative">
      <div className="flex items-center gap-1 text-xs font-mono text-zinc-500 mr-4">
        <span className="uppercase tracking-widest font-bold">Quest Map</span>
      </div>
      
      <div className="flex items-center flex-1">
        {levels.map((level, idx) => {
          const isCompleted = idx < currentLevelIndex;
          const isCurrent = idx === currentLevelIndex;
          const isLocked = idx > currentLevelIndex;
          const isNext = idx === currentLevelIndex + 1;

          return (
            <div key={level.id} className="flex items-center group">
              {/* Connector */}
              {idx > 0 && (
                <div className={`w-6 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-green-700' : 'bg-zinc-800'}`} />
              )}

              {/* Stage Node */}
              <div 
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-all duration-300
                  ${isCompleted ? 'bg-zinc-900/50 border-green-800 text-green-500 opacity-60 hover:opacity-100' : ''}
                  ${isCurrent ? 'bg-zinc-800 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-105 z-10' : ''}
                  ${isLocked ? 'bg-transparent border-transparent text-zinc-700' : ''}
                  ${isNext ? 'text-zinc-500 border-zinc-800 border-dashed' : ''}
                `}
              >
                <div className="flex items-center justify-center">
                  {isCompleted && <Check size={10} strokeWidth={3} />}
                  {isCurrent && <MapPin size={10} className="animate-pulse" />}
                  {isLocked && !isNext && <Lock size={10} />}
                  {isNext && <div className="w-2.5 h-2.5 rounded-full border-2 border-zinc-700" />}
                </div>
                {(isCurrent || isCompleted || isNext) && (
                   <span className="whitespace-nowrap font-bold">
                    {idx + 1}
                  </span>
                )}
                 {isCurrent && (
                     <span className="whitespace-nowrap font-bold ml-1 hidden sm:inline-block">
                        {level.title}
                     </span>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
