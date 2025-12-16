import React, { useState, useEffect, useRef } from 'react';
import { Level } from '../types';
import { EPISODE_LORE } from '../constants';
import { Check, Lock, MapPin, X, Map, Shield, Zap, Crown, HelpCircle, Lightbulb, GitBranch, CheckSquare, Square } from 'lucide-react';

interface LevelProgressProps {
  levels: Level[];
  currentLevelIndex: number;
  onToggleHint: () => void;
  onToggleHelp: () => void;
  onToggleMap?: () => void;
  onJumpToLevel?: (levelIndex: number) => void;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ levels, currentLevelIndex, onToggleHint, onToggleHelp, onToggleMap, onJumpToLevel }) => {
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedMissionIdx, setSelectedMissionIdx] = useState<number>(0);
  const missionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleToggleMap = () => {
    setShowLegend(prev => !prev);
    onToggleMap?.(); // Notify parent if callback provided
  };

  // Keyboard shortcut: Alt+M to toggle map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' && e.altKey) {
        e.preventDefault();
        handleToggleMap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        // Find the current level within the episode and select it
        const currentEpisodeLevels = episodes[currentEpisodeIdx]?.levels || [];
        const currentLevelInEpisode = currentEpisodeLevels.findIndex(l => levels.indexOf(l) === currentLevelIndex);
        setSelectedMissionIdx(currentLevelInEpisode >= 0 ? currentLevelInEpisode : 0);
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

  // Keyboard navigation for Quest Map modal
  useEffect(() => {
    if (!showLegend) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeLevels = episodes[activeTab]?.levels || [];

      // h - Previous episode
      if (e.key === 'h') {
        e.preventDefault();
        setActiveTab(prev => Math.max(0, prev - 1));
        setSelectedMissionIdx(0);
      }
      // l - Next episode
      else if (e.key === 'l') {
        e.preventDefault();
        setActiveTab(prev => Math.min(episodes.length - 1, prev + 1));
        setSelectedMissionIdx(0);
      }
      // j - Next mission
      else if (e.key === 'j') {
        e.preventDefault();
        setSelectedMissionIdx(prev => Math.min(activeLevels.length - 1, prev + 1));
      }
      // k - Previous mission
      else if (e.key === 'k') {
        e.preventDefault();
        setSelectedMissionIdx(prev => Math.max(0, prev - 1));
      }
      // Enter - Jump to selected mission
      else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedLevel = activeLevels[selectedMissionIdx];
        if (selectedLevel && onJumpToLevel) {
          const globalIdx = levels.findIndex(l => l.id === selectedLevel.id);
          if (globalIdx !== -1) {
            onJumpToLevel(globalIdx);
            setShowLegend(false);
          }
        }
      }
      // Esc - Close modal
      else if (e.key === 'Escape') {
        e.preventDefault();
        setShowLegend(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLegend, activeTab, selectedMissionIdx, episodes, levels, onJumpToLevel]);

  // Auto-scroll to selected mission
  useEffect(() => {
    if (showLegend) {
        setTimeout(() => {
            missionRefs.current[selectedMissionIdx]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }, 50); // Timeout ensures DOM is ready
    }
  }, [selectedMissionIdx, showLegend, activeTab]);

  return (
    <>
      <div className="w-full bg-black/50 border-b border-zinc-800 py-3 px-6 flex items-center justify-between backdrop-blur-sm z-[70] relative">
        
        {/* Left Side: Map Button + Current Episode Progress */}
        <div className="flex items-center gap-6 overflow-hidden mr-4 h-8 flex-1">
            <button
                onClick={handleToggleMap}
                className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors group cursor-pointer focus:outline-none shrink-0"
                title="Quest Map [Alt+M]"
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
                   title="Hint [Shift+H]"
                 >
                   <Lightbulb size={18} />
                 </button>
                 <button
                   onClick={onToggleHelp}
                   className="flex items-center justify-center w-8 h-8 rounded hover:bg-zinc-800 text-zinc-500 hover:text-blue-500 transition-colors border border-transparent hover:border-zinc-700"
                   title="Help [?]"
                 >
                   <HelpCircle size={18} />
                 </button>
            </div>
        </div>
      </div>

      {/* Legend Modal */}
      {showLegend && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
               <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <Map className="text-zinc-400" size={20} />
                      <h2 className="text-xl font-bold text-white tracking-widest uppercase">Quest Map</h2>
                    </div>
                    <div className="text-xs text-zinc-600 font-mono">h/l: episodes • j/k: missions • Enter: jump • Esc: close</div>
               </div>
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
                  {activeEpisode.levels.map((level, missionIdx) => {
                       // Calculate global index to check status against currentLevelIndex
                       const globalIdx = levels.findIndex(l => l.id === level.id);

                       const status = globalIdx < currentLevelIndex ? 'completed' : globalIdx === currentLevelIndex ? 'active' : 'locked';
                       const isKeyboardSelected = missionIdx === selectedMissionIdx;

                       return (
                        <div
                            key={level.id}
                            ref={el => { missionRefs.current[missionIdx] = el; }}
                            className={`
                            p-4 rounded border flex items-center gap-4 transition-all duration-200 relative overflow-hidden cursor-pointer
                            ${status === 'active' ? `bg-zinc-900 ${activeEpisode.border} border-l-4` : 'border-zinc-800/50 bg-zinc-900/30'}
                            ${status === 'completed' ? 'opacity-60 hover:opacity-100' : ''}
                            ${status === 'locked' ? 'opacity-40 grayscale' : ''}
                            ${isKeyboardSelected ? 'ring-2 ring-white/30 scale-[1.02] shadow-xl' : ''}
                            `}
                            onClick={() => {
                              if (onJumpToLevel) {
                                onJumpToLevel(globalIdx);
                                setShowLegend(false);
                              }
                            }}
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
                                    <div className="flex items-center gap-2">
                                      <h3 className={`font-bold tracking-wide ${status === 'active' ? 'text-white' : 'text-zinc-400'}`}>
                                          {level.title}
                                      </h3>
                                      {status === 'completed' && <span className="text-[9px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800">✓ COMPLETE</span>}
                                      {status === 'active' && <span className="text-[9px] bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded border border-orange-800 animate-pulse">● ACTIVE</span>}
                                      {status === 'locked' && <span className="text-[9px] bg-zinc-900 text-zinc-600 px-2 py-0.5 rounded border border-zinc-800">🔒 LOCKED</span>}
                                    </div>
                                </div>

                                {/* Core Skill Badge */}
                                {level.coreSkill && (
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold font-mono text-cyan-300 bg-cyan-800/50 px-2 py-1 rounded border border-cyan-700/50">
                                            {level.coreSkill}
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs text-zinc-500 leading-relaxed mb-3">{level.description}</p>

                                {/* Intel / Environmental Clue */}
                                {level.environmentalClue && (
                                    <div className="bg-yellow-950/20 border border-yellow-900/30 rounded p-2 mb-3">
                                        <h4 className="text-[9px] uppercase font-bold text-yellow-600 mb-1 tracking-widest">
                                            Intel
                                        </h4>
                                        <p className="text-[10px] font-mono text-yellow-500/80 leading-relaxed">
                                            {level.environmentalClue}
                                        </p>
                                    </div>
                                )}

                                {/* Skill Tree */}
                                {(level.buildsOn?.length || level.leadsTo?.length) && (
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2 mb-3">
                                        <h4 className="text-[9px] uppercase font-bold text-zinc-500 mb-1 tracking-widest flex items-center gap-1">
                                            <GitBranch size={9} />
                                            Skill Tree
                                        </h4>
                                        <div className="space-y-1 text-[10px] font-mono">
                                            {level.buildsOn && level.buildsOn.length > 0 && (
                                                <div className="text-zinc-500">
                                                    <span className="text-zinc-600">REQUIRES:</span>{' '}
                                                    {level.buildsOn.map(id => `L${id}`).join(', ')}
                                                </div>
                                            )}
                                            {level.leadsTo && level.leadsTo.length > 0 && (
                                                <div className="text-zinc-500">
                                                    <span className="text-zinc-600">UNLOCKS:</span>{' '}
                                                    {level.leadsTo.map(id => `L${id}`).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tasks - Expanded with Details */}
                                <div className="mt-2">
                                    <h4 className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        Objectives
                                        {status === 'active' && (
                                            <span className="text-orange-500">
                                                • {level.tasks.filter(t => t.completed).length}/{level.tasks.length} Complete
                                            </span>
                                        )}
                                        {status === 'completed' && (
                                            <span className="text-green-600">
                                                • All Complete
                                            </span>
                                        )}
                                    </h4>
                                    <div className="space-y-2">
                                        {level.tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`flex gap-2 items-start transition-all duration-300 rounded px-2 py-1 -mx-2 ${
                                                    task.completed
                                                        ? 'opacity-60 bg-green-950/20 border-l-2 border-green-500'
                                                        : 'opacity-100 border-l-2 border-transparent'
                                                }`}
                                            >
                                                <div className={`mt-0.5 shrink-0 transition-all duration-300 ${
                                                    task.completed
                                                        ? 'text-green-500 scale-110'
                                                        : 'text-zinc-600'
                                                }`}>
                                                    {task.completed ? <CheckSquare size={12} /> : <Square size={12} />}
                                                </div>
                                                <div className={`text-[10px] font-mono leading-tight transition-all duration-300 ${
                                                    task.completed
                                                        ? 'line-through text-green-600/70'
                                                        : 'text-zinc-400'
                                                }`}>
                                                    {task.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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