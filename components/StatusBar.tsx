import React from 'react';
import { GameState, Level } from '../types';
import { Scissors, Copy, Filter } from 'lucide-react';
import { resolvePath } from '../utils/fsHelpers';

interface StatusBarProps {
  state: GameState;
  level: Level;
  allTasksComplete: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ state, level, allTasksComplete }) => {
  // Yazi Style Colors
  // Normal: Blue/Cyan
  // Input: Green
  // Visual: Orange/Yellow
  // Filter: Purple
  
  let modeBg = 'bg-blue-600';
  let modeText = 'NOR';
  
  if (state.mode.startsWith('input')) {
    modeBg = 'bg-green-600';
    modeText = 'INS';
  } else if (state.mode === 'filter') {
    modeBg = 'bg-purple-600';
    modeText = 'FLT';
  } else if (state.selectedIds.length > 0) {
    modeBg = 'bg-orange-600';
    modeText = 'VIS';
  }

  const completedTasks = level.tasks.filter(t => t.completed).length;
  const totalTasks = level.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Fake permissions/size for aesthetic
  const fakePerms = state.mode === 'input-dir' ? 'drwxr-xr-x' : '-rw-r--r--';
  
  // Timer formatting
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = state.timeLeft !== null && state.timeLeft <= 10;
  
  // Keystroke logic
  const showKeystrokes = level.maxKeystrokes !== undefined;
  const isHighKeystrokes = showKeystrokes && state.keystrokes >= (level.maxKeystrokes! * 0.9);

  return (
    <div className="h-6 flex text-xs font-mono select-none bg-zinc-900 border-t border-zinc-800 z-30">
      {/* 1. Mode Block */}
      <div className={`${modeBg} text-black font-bold px-3 flex items-center`}>
        {modeText}
      </div>
      
      {/* 2. Path Triangle (CSS Hack for shape or just color block) */}
      <div className={`${modeBg} w-0 h-0 border-t-[24px] border-t-transparent border-l-[10px] border-l-zinc-900 -ml-[1px]`}></div>

      {/* 3. File Info / Path */}
      <div className="flex-1 bg-zinc-800 text-zinc-300 px-3 flex items-center border-r border-zinc-700 overflow-hidden">
        <span className="truncate mr-4">
            {resolvePath(state.fs, state.currentPath)}
        </span>
        
        {/* Quest Info embedded in status bar */}
        <span className="text-zinc-500 hidden sm:inline-block whitespace-nowrap">
            {progress}% OP: {level.title}
        </span>
      </div>

      {/* 3.2 Filter Active Indicator */}
      {state.filter && (
        <div className="px-3 bg-purple-900/50 text-purple-200 border-l border-purple-700 flex items-center gap-2 font-bold animate-pulse">
            <Filter size={10} />
            <span>FILTER: "{state.filter}"</span>
        </div>
      )}

      {/* 3.5 Clipboard Indicator */}
      {state.clipboard && (
          <div className={`px-3 flex items-center gap-2 font-bold ${
              state.clipboard.action === 'cut' 
                  ? 'bg-red-900/50 text-red-200 border-l border-red-700' 
                  : 'bg-blue-900/50 text-blue-200 border-l border-blue-700'
          }`}>
              {state.clipboard.action === 'cut' ? <Scissors size={10} /> : <Copy size={10} />}
              <span>
                  {state.clipboard.action === 'cut' ? 'MOVE' : 'COPY'}: {state.clipboard.nodes.length}
              </span>
          </div>
      )}

      {/* 4. Timer / Metrics (Right Aligned) */}
      <div className="flex bg-zinc-800">
        {/* Show Timer if active */}
        {state.timeLeft !== null && !showKeystrokes && (
            <div className={`px-4 py-0.5 font-bold border-l border-zinc-700 flex items-center gap-2 transition-colors ${
              isLowTime 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-red-900/80 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
            }`}>
                <span className="hidden sm:inline text-[10px] opacity-90 uppercase tracking-widest">Time:</span>
                <span className="font-mono text-sm">{formatTime(state.timeLeft)}</span>
            </div>
        )}
        
        {/* Show Keystrokes if Mastery Level */}
        {showKeystrokes && (
             <div className={`px-3 font-bold border-l border-zinc-700 flex items-center gap-2 ${isHighKeystrokes ? 'text-red-500 bg-red-950/30' : 'text-yellow-500'}`}>
                 <span className="hidden sm:inline text-[10px] opacity-70">KEYS:</span>
                 <span className="font-mono text-sm">{state.keystrokes}/{level.maxKeystrokes}</span>
             </div>
        )}

        {state.notification && (
            <div className="px-3 bg-zinc-800 text-yellow-400 font-bold border-l border-zinc-700 flex items-center italic max-w-[400px] truncate">
            {state.notification}
            </div>
        )}
      </div>

      {/* 5. Stats Block */}
      <div className="bg-zinc-700 text-zinc-300 px-3 flex items-center gap-4 hidden md:flex">
        <span className="text-zinc-400">{fakePerms}</span>
        <span>
             {state.cursorIndex + 1}/{state.fs.children?.length || 1}
        </span>
        <div className="w-12 h-1 bg-zinc-600 rounded-full overflow-hidden">
             <div 
               className="h-full bg-blue-400" 
               style={{ width: `${Math.min(((state.cursorIndex + 1) / (state.fs.children?.length || 1)) * 100, 100)}%` }} 
             />
        </div>
      </div>
      
      {/* 6. Percentage Block */}
      <div className="bg-blue-600 text-black font-bold px-2 flex items-center">
        {Math.round(((state.cursorIndex + 1) / (state.fs.children?.length || 1)) * 100)}%
      </div>
    </div>
  );
};