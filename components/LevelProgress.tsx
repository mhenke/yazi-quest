import React, { useState } from 'react';
import { Level } from '../types';
import { Check, Lock, MapPin, X, Map } from 'lucide-react';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels, currentLevelIndex }) => {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <>
      <div className="w-full bg-black/50 border-b border-zinc-800 py-3 px-6 flex items-center gap-2 overflow-x-auto select-none backdrop-blur-sm z-10 relative">
        <button 
          onClick={() => setShowLegend(true)}
          className="flex items-center gap-2 text-xs font-mono text-zinc-500 mr-4 hover:text-white transition-colors group cursor-pointer focus:outline-none"
          title="View Full Quest Map"
        >
          <Map size={14} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
          <span className="uppercase tracking-widest font-bold border-b border-transparent group-hover:border-zinc-500">Quest Map</span>
        </button>
        
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

      {/* Legend Modal */}
      {showLegend && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLegend(false)}>
          <div 
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700 shadow-2xl p-6 relative max-h-[80vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <button 
                onClick={() => setShowLegend(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
                <X size={18} />
            </button>
            
            <div className="mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2">
               <Map className="text-orange-500" size={20} />
               <h2 className="text-xl font-bold text-white tracking-wider">QUEST MAP</h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {levels.map((level, idx) => {
                 const status = idx < currentLevelIndex ? 'completed' : idx === currentLevelIndex ? 'active' : 'locked';
                 return (
                   <div 
                     key={level.id} 
                     className={`
                       p-3 rounded border flex items-center gap-4 transition-colors
                       ${status === 'active' ? 'bg-zinc-800 border-orange-500/50' : 'border-zinc-800 bg-black/20'}
                       ${status === 'completed' ? 'opacity-70 hover:opacity-100' : ''}
                     `}
                   >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                        ${status === 'completed' ? 'bg-green-900/30 text-green-500' : ''}
                        ${status === 'active' ? 'bg-orange-500 text-black' : ''}
                        ${status === 'locked' ? 'bg-zinc-800 text-zinc-600' : ''}
                      `}>
                         {status === 'completed' ? <Check size={16} /> : idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className={`font-bold ${status === 'active' ? 'text-white' : status === 'completed' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {level.title}
                            </h3>
                            {status === 'active' && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">Current</span>}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{level.description}</p>
                      </div>
                   </div>
                 );
              })}
            </div>
            
            <div className="mt-6 text-center text-xs text-zinc-600 font-mono">
               Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};