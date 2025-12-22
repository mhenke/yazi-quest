import React from 'react';
import { AlertTriangle, RotateCcw, Zap } from 'lucide-react';

interface GameOverModalProps {
  reason: 'time' | 'keystrokes';
  onRestart: () => void;
  efficiencyTip?: string; // Level-specific tip from constants.tsx
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  onRestart,
  efficiencyTip,
}) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-red-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-black border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] p-8 text-center relative overflow-hidden">
        {/* Scanline bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-red-500 animate-pulse">
            <AlertTriangle size={64} strokeWidth={1.5} />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-red-500 tracking-widest uppercase mb-2 glitch-text">
              CONNECTION LOST
            </h2>
            <p className="text-red-400 font-mono uppercase tracking-wider text-sm">
              {reason === 'time' ? 'TIMEOUT EXCEEDED' : 'MAX KEYSTROKES EXCEEDED'}
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-800/50 p-4 rounded w-full">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2 font-bold uppercase text-xs tracking-wider">
              <Zap size={14} />
              <span>Efficiency Protocol</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-mono">
              {efficiencyTip ||
                (reason === 'time'
                  ? 'The system traced your connection. Optimize your path and use batch operations.'
                  : 'Your input noise levels triggered the IDS. Reduce keystrokes by planning your route.')}
            </p>
          </div>

          <button
            onClick={onRestart}
            className="group flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-sm font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-lg shadow-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <RotateCcw
              size={18}
              className="group-hover:-rotate-180 transition-transform duration-500"
            />
            <span>Reinitialize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
