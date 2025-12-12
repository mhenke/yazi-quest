import React, { useState, useEffect } from 'react';
import { Level } from '../types';
import { EPISODE_LORE } from '../constants';
import { Check, Lock, MapPin, X, Map, Shield, Zap, Crown, HelpCircle, Lightbulb } from 'lucide-react';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
  onToggleHint: () => void;
  onToggleHelp: () => void;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels, currentLevelIndex, onToggleHint, onToggleHelp }) => {
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Helper icons for the 3 episodes (mapped by index)
  // Ep 1: Zap (Awakening), Ep 2: Shield (Fortification), Ep 3: Crown (Mastery)
  const episodeIcons = [Zap, Shield, Crown];

  // Derive Episode Data based on episodeId property
  const episodes = EPISODE_LORE.map((lore, idx) => ({
    ...lore,
    levels: levels.filter(l => l.episodeId === lore.id),
    border: lore.color.replace('text-', 'border-') + '/30',
    bg: lore.color.replace('text-', 'bg-') + '/10',
    icon: episodeIcons[idx] || Shield
  }));

  // Determine completion status
  // Episode is complete if currentLevelIndex is past the last level of this episode
  const completionStatus = episodes.map((ep) => {
      const lastLevelOfEpisode = ep.levels[ep.levels.length - 1];
      const lastLevelGlobalIdx = levels.indexOf(lastLevelOfEpisode);
      return currentLevelIndex > lastLevelGlobalIdx;
  });
  
  // Determine current active episode index based on currentLevelIndex
  const currentLevel = levels[currentLevelIndex];
  const currentEpisodeId = currentLevel ? currentLevel.episodeId : 1;
  const currentEpisodeIdx = currentEpisodeId - 1;

  // Sync modal tab with current episode when opening
  useEffect(() => {
    if (showLegend) {
        setActiveTab(currentEpisodeIdx);
    }
  }, [showLegend, currentEpisodeIdx]);

  const activeEpisode = episodes[activeTab] || episodes[0];

  const getEpisodeStatus = (tabIndex: number) => {
    const isThisComplete = completionStatus[tabIndex];
    // If it's the first episode, active if not complete. 
    // If not first, active if prev complete & this not complete.
    const isPrevComplete = tabIndex === 0 ? true : completionStatus[tabIndex - 1];

    if (isThisComplete) return 'completed';
    if (isPrevComplete) return 'active';
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
        <div className="flex items-center gap-6 overflow-hidden mr-4 h-8 flex-1">
            <button 
                onClick={() => setShowLegend(true)}
                className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors group cursor-pointer focus:outline-none shrink-0"
                title="View Full Quest Map"
            >
                <Map size={14} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                <span className="uppercase tracking-widest font-bold border-b border-transparent group-hover:border-zinc-500">Map</span>
            </button>
            
            <div className="h-4 w-px bg-zinc-800 shrink-0"></div>

            <div className="flex flex-col justify-center h-full">
                 <div className="flex items-center gap-2 mb-1">
                     <span className={`text-[10px] uppercase font-bold tracking-widest leading-none ${episodes[currentEpisodeIdx]?.color}`}>
                        {episodes[currentEpisodeIdx]?.shortTitle}
                     </span>
                 </div>
                 
                 <div className="flex items-center h-4 max-w-[200px] sm:max-w-none overflow-x-auto scrollbar-hide">
                    {episodes[currentEpisodeIdx]?.levels.map((level, idx) => {
                        const globalIdx = levels.indexOf(level);
                        const isCompleted = globalIdx < currentLevelIndex;
                        const isCurrent = globalIdx === currentLevelIndex;
                        const isLocked = globalIdx > currentLevelIndex;
                        
                        // Local index 1-N for display
                        const displayNum = idx + 1;

                        return (
                        <div key={level.id} className="flex items-center group shrink-0">
                            {/* Connector */}
                            {idx > 0 && (
                                <div className={`w-3 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                            )}

                            {/* Stage Node */}
                            <div 
                            className={`
                                flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[9px] font-mono transition-all duration-300
                                ${isCompleted ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : ''}
                                ${isCurrent ? `bg-zinc-900 ${episodes[currentEpisodeIdx].border} ${episodes[currentEpisodeIdx].color} shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105 z-10` : ''}
                                ${isLocked ? 'bg-transparent border-transparent text-zinc-700' : ''}
                            `}
                            >
                                <div className="flex items-center justify-center">
                                    {isCompleted && <Check size={8} strokeWidth={3} />}
                                    {isCurrent && <MapPin size={8} className="animate-pulse" />}
                                    {isLocked && <div className="w-1 h-1 rounded-full bg-zinc-800" />}
                                </div>
                                
                                {(isCurrent) && (
                                    <span className="whitespace-nowrap font-bold">
                                        {level.title}
                                    </span>
                                )}
                                {(!isCurrent && !isLocked) && (
                                     <span className="font-bold">{displayNum}</span>
                                )}
                            </div>
                        </div>
                        );
                    })}
                 </div>
            </div>
        </div>

        {/* Right Side: Trilogy Badges & Controls */}
        <div className="flex items-center gap-6 shrink-0 h-8">
            {/* Badges */}
            <div className="flex items-center gap-6 px-6 border-l border-r border-zinc-800">
                {episodes.map((ep, idx) => {
                    const isComplete = completionStatus[idx];
                    const Icon = ep.icon;
                    
                    const baseColor = ep.color.split('-')[1]; 
                    const shadowColor = baseColor === 'blue' ? 'rgba(96,165,250,0.5)' : 
                                        baseColor === 'purple' ? 'rgba(192,132,252,0.5)' : 
                                        'rgba(250,204,21,0.5)';

                    return (
                        <div key={ep.id} className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-700 ${isComplete ? `text-${baseColor}-400 scale-110` : 'text-zinc-600'}`}
                            style={isComplete ? { filter: `drop-shadow(0 0 8px ${shadowColor})` } : {}}
                        >
                            <Icon size={14} fill={isComplete ? "currentColor" : "none"} />
                            <span className="text-[8px] uppercase font-bold tracking-wider hidden sm:inline-block leading-none mt-0.5">
                                {ep.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Hint & Help Controls */}
            <div className="flex items-center gap-2">
                 <button 
                   onClick={onToggleHint}
                   className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-500 hover:text-yellow-500 transition-colors border border-transparent hover:border-zinc-700"
                   title="Hint [H]"
                 >
                   <Lightbulb size={18} />
                 </button>
                 <button 
                   onClick={onToggleHelp}
                   className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-500 hover:text-blue-500 transition-colors border border-transparent hover:border-zinc-700"
                   title="Help / Keybindings [?]"
                 >
                   <HelpCircle size={18} />
                 </button>
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
                        onClick={() => setActiveTab(idx)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex flex-col items-center gap-1
                            ${activeTab === idx ? `${ep.color} ${ep.bg} border-current` : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-zinc-900'}
                        `}
                    >   
                        <span>{ep.shortTitle}</span>
                        <span className="text-[9px] opacity-60">{ep.levels.length} Levels</span>
                    </button>
                ))}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              <div className="space-y-3">
                  {activeEpisode.levels.map((level) => {
                       // Calculate global index to check status against currentLevelIndex
                       const globalIdx = levels.findIndex(l => l.id === level.id);
                       
                       const status = globalIdx < currentLevelIndex ? 'completed' : globalIdx === currentLevelIndex ? 'active' : 'locked';
                       
                       return (
                        <div 
                            key={level.id} 
                            className={`
                            p-4 rounded border flex items-center gap-4 transition-all duration-300 relative overflow-hidden
                            ${status === 'active' ? `bg-zinc-900 ${activeEpisode.border} border-l-4` : 'border-zinc-800/50 bg-zinc-900/30'}
                            ${status === 'completed' ? 'opacity-60 hover:opacity-100' : ''}
                            ${status === 'locked' ? 'opacity-40 grayscale' : ''}
                            `}
                        >
                            {/* Status Icon */}
                            <div className={`
                                w-8 h-8 rounded flex items-center justify-center font-bold text-sm shrink-0 shadow-inner
                                ${status === 'completed' ? 'bg-zinc-800 text-green-500' : ''}
                                ${status === 'active' ? `bg-zinc-800 ${activeEpisode.color}` : ''}
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
                                {React.createElement(activeEpisode.icon, { size: 80 })}
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