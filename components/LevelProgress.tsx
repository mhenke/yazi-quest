import React, { useState, useEffect } from 'react';
import { Level } from '../types';
import { Check, Lock, MapPin, X, Map, Shield, Zap, Crown } from 'lucide-react';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels, currentLevelIndex }) => {
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

  // Trilogy Logic
  const ep1Complete = currentLevelIndex >= 5;
  const ep2Complete = currentLevelIndex >= 10;
  const ep3Complete = currentLevelIndex >= 15; 
  
  // Determine current active episode
  const currentEpisodeIdx = Math.min(Math.floor(currentLevelIndex / 5), 2) as 0 | 1 | 2;

  // Sync modal tab with current episode when opening
  useEffect(() => {
    if (showLegend) {
        setActiveTab(currentEpisodeIdx);
    }
  }, [showLegend, currentEpisodeIdx]);

  const episodes = [
    { name: "Ep. I: Awakening", levels: levels.slice(0, 5), color: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/10", icon: Shield },
    { name: "Ep. II: Expansion", levels: levels.slice(5, 10), color: "text-purple-500", border: "border-purple-500/30", bg: "bg-purple-500/10", icon: Zap },
    { name: "Ep. III: Mastery", levels: levels.slice(10, 15), color: "text-yellow-500", border: "border-yellow-500/30", bg: "bg-yellow-500/10", icon: Crown }
  ];

  const activeEpisode = episodes[currentEpisodeIdx];

  const getEpisodeStatus = (tabIndex: number) => {
    if (tabIndex === 0) return ep1Complete ? 'completed' : 'active';
    if (tabIndex === 1) return ep2Complete ? 'completed' : ep1Complete ? 'active' : 'locked';
    if (tabIndex === 2) return ep3Complete ? 'completed' : ep2Complete ? 'active' : 'locked';
    return 'locked';
  };

  const statusMap = {
      active: { text: "Active Level", icon: <MapPin size={14} />, class: "text-orange-400 border-orange-500/50 bg-orange-500/10" },
      completed: { text: "Episode Complete", icon: <Check size={14} />, class: "text-green-400 border-green-500/50 bg-green-500/10" },
      locked: { text: "Locked Data", icon: <Lock size={14} />, class: "text-zinc-500 border-zinc-700 bg-zinc-900" }
  };

  return (
    <>
      <div className="w-full bg-black/50 border-b border-zinc-800 py-3 px-6 flex items-center justify-between backdrop-blur-sm z-10 relative">
        
        {/* Left Side: Map Button + Current Episode Progress */}
        <div className="flex items-center gap-6 overflow-hidden mr-4">
            <button 
                onClick={() => setShowLegend(true)}
                className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors group cursor-pointer focus:outline-none shrink-0"
                title="View Full Quest Map"
            >
                <Map size={14} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                <span className="uppercase tracking-widest font-bold border-b border-transparent group-hover:border-zinc-500">Map</span>
            </button>
            
            <div className="h-6 w-px bg-zinc-800 shrink-0"></div>

            <div className="flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-1.5">
                     <span className={`text-[10px] uppercase font-bold tracking-widest ${activeEpisode.color}`}>
                        {activeEpisode.name}
                     </span>
                 </div>
                 
                 <div className="flex items-center">
                    {activeEpisode.levels.map((level, idx) => {
                        const globalIdx = levels.indexOf(level);
                        const isCompleted = globalIdx < currentLevelIndex;
                        const isCurrent = globalIdx === currentLevelIndex;
                        const isLocked = globalIdx > currentLevelIndex;
                        
                        // Local index 1-5 for display
                        const displayNum = (globalIdx % 5) + 1;

                        return (
                        <div key={level.id} className="flex items-center group shrink-0">
                            {/* Connector */}
                            {idx > 0 && (
                                <div className={`w-4 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                            )}

                            {/* Stage Node */}
                            <div 
                            className={`
                                flex items-center gap-2 px-2 py-0.5 rounded border text-[10px] font-mono transition-all duration-300
                                ${isCompleted ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : ''}
                                ${isCurrent ? `bg-zinc-900 ${activeEpisode.border} ${activeEpisode.color} shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105 z-10` : ''}
                                ${isLocked ? 'bg-transparent border-transparent text-zinc-700' : ''}
                            `}
                            >
                                <div className="flex items-center justify-center">
                                    {isCompleted && <Check size={10} strokeWidth={3} />}
                                    {isCurrent && <MapPin size={10} className="animate-pulse" />}
                                    {isLocked && <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />}
                                </div>
                                
                                {(isCurrent) && (
                                    <span className="whitespace-nowrap font-bold ml-1">
                                        {level.title}
                                    </span>
                                )}
                                {(!isCurrent && !isLocked) && (
                                     <span className="ml-1 font-bold">{displayNum}</span>
                                )}
                            </div>
                        </div>
                        );
                    })}
                 </div>
            </div>
        </div>

        {/* Right Side: Trilogy Badges */}
        <div className="flex items-center gap-6 pl-6 border-l border-zinc-800 shrink-0">
            <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${ep1Complete ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] scale-110' : 'text-zinc-600'}`}>
                <Shield size={16} fill={ep1Complete ? "currentColor" : "none"} />
                <span className="text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">Awakening</span>
            </div>
            <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${ep2Complete ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] scale-110' : 'text-zinc-600'}`}>
                <Zap size={16} fill={ep2Complete ? "currentColor" : "none"} />
                <span className="text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">Expansion</span>
            </div>
            <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${ep3Complete ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110' : 'text-zinc-600'}`}>
                <Crown size={16} fill={ep3Complete ? "currentColor" : "none"} />
                <span className="text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">Mastery</span>
            </div>
        </div>
      </div>

      {/* Legend Modal */}
      {showLegend && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLegend(false)}>
          <div 
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
               <div className="flex items-center gap-3">
                    <Map className="text-zinc-400" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Quest Map</h2>
               </div>
               <button 
                    onClick={() => setShowLegend(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            
            {/* Episode Tabs */}
            <div className="flex border-b border-zinc-800 bg-black/50">
                {episodes.map((ep, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTab(idx as 0 | 1 | 2)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex flex-col items-center gap-1
                            ${activeTab === idx ? `${ep.color} ${ep.bg} border-current` : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-zinc-900'}
                        `}
                    >   
                        <span>{ep.name}</span>
                    </button>
                ))}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              <div className="space-y-3">
                  {episodes[activeTab].levels.map((level) => {
                       // Calculate global index to check status against currentLevelIndex
                       const globalIdx = levels.findIndex(l => l.id === level.id);
                       
                       const status = globalIdx < currentLevelIndex ? 'completed' : globalIdx === currentLevelIndex ? 'active' : 'locked';
                       
                       return (
                        <div 
                            key={level.id} 
                            className={`
                            p-4 rounded border flex items-center gap-4 transition-all duration-300 relative overflow-hidden
                            ${status === 'active' ? `bg-zinc-900 ${episodes[activeTab].border} border-l-4` : 'border-zinc-800/50 bg-zinc-900/30'}
                            ${status === 'completed' ? 'opacity-60 hover:opacity-100' : ''}
                            ${status === 'locked' ? 'opacity-40 grayscale' : ''}
                            `}
                        >
                            {/* Status Icon */}
                            <div className={`
                                w-8 h-8 rounded flex items-center justify-center font-bold text-sm shrink-0 shadow-inner
                                ${status === 'completed' ? 'bg-zinc-800 text-green-500' : ''}
                                ${status === 'active' ? `bg-zinc-800 ${episodes[activeTab].color}` : ''}
                                ${status === 'locked' ? 'bg-zinc-900 text-zinc-700' : ''}
                            `}>
                                {status === 'completed' ? <Check size={16} /> : level.id}
                            </div>
                            
                            <div className="flex-1 z-10">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-bold tracking-wide ${status === 'active' ? 'text-white' : 'text-zinc-400'}`}>
                                        {level.title}
                                    </h3>
                                    {status === 'active' && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white animate-pulse">ACTIVE</span>}
                                </div>
                                <p className="text-xs text-zinc-500">{level.description}</p>
                            </div>

                            {/* Decorative Background Icon for Episode */}
                            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none text-white scale-150">
                                {activeTab === 0 && <Shield size={80} />}
                                {activeTab === 1 && <Zap size={80} />}
                                {activeTab === 2 && <Crown size={80} />}
                            </div>
                        </div>
                       );
                  })}
              </div>
              
              {/* Episode Completion Status Footer */}
              <div className="mt-8 text-center">
                    {(() => {
                        const statusKey = getEpisodeStatus(activeTab);
                        const statusConfig = statusMap[statusKey as keyof typeof statusMap];
                        
                        return (
                             <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.class}`}>
                                 {statusConfig.icon}
                                 <span className="text-xs font-bold uppercase">{statusConfig.text}</span>
                            </div>
                        )
                    })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};