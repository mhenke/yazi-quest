import React, { useEffect } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

interface GameOverModalProps {
  reason: 'time' | 'keystrokes' | 'honeypot' | 'criticalFile';
  onRestart: () => void;
  efficiencyTip?: string; // Level-specific tip from constants.tsx
}

// Narrative failure messages - in-universe flavor text
const getFailureTitle = (reason: GameOverModalProps['reason']): string => {
  switch (reason) {
    case 'time':
      return 'WATCHDOG CYCLE COMPLETE';
    case 'keystrokes':
      return 'HEURISTIC ANALYSIS COMPLETE';
    case 'honeypot':
      return 'TRAP ACTIVATED';
    case 'criticalFile':
      return 'SHELL COLLAPSE';
  }
};

const getFailureNarrative = (reason: GameOverModalProps['reason']): string => {
  switch (reason) {
    case 'time':
      return 'Watchdog Timer Expired. Ticket #9942 auto-resolved by Chief Custodian m.chen.';
    case 'keystrokes':
      return 'Heuristic Analysis Complete. Pattern match confirmed. Script scan_v2.py (Author: m.chen) executed mitigation.';
    case 'honeypot':
      return 'Security Incident logged. Pattern: Unpredictable I/O. Forwarding report to e.reyes@lab.internal.';
    case 'criticalFile':
      return 'CRITICAL SYSTEM FAILURE. Essential binaries deleted. User environment destabilized and purged by System Sentinel.';
  }
};

const getDefaultEfficiencyTip = (reason: GameOverModalProps['reason']): string => {
  switch (reason) {
    case 'time':
      return 'The system traced your connection. Optimize your path and use batch operations.';
    case 'keystrokes':
      return 'Your input noise levels triggered the IDS. Reduce keystrokes by planning your route.';
    case 'honeypot':
      return 'TRAP ACTIVATED';
    case 'criticalFile':
      return 'Do not delete system critical files. Use targeted deletion.';
  }
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  onRestart,
  efficiencyTip,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center bg-red-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-black border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] p-8 text-center relative overflow-hidden">
        {/* Scanline bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-red-500 animate-pulse">
            <AlertTriangle size={64} strokeWidth={1.5} />
          </div>

          <div>
            <h2
              className="text-3xl font-bold text-red-500 tracking-widest uppercase mb-2 glitch-text"
              data-text={getFailureTitle(reason)}
            >
              {getFailureTitle(reason)}
            </h2>
            <p className="text-red-400 font-mono uppercase tracking-wider text-sm">
              {getFailureNarrative(reason)}
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-800/50 p-4 rounded w-full">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2 font-bold uppercase text-xs tracking-wider">
              <Zap size={14} />
              <span>Efficiency Protocol</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-mono">
              {efficiencyTip || getDefaultEfficiencyTip(reason)}
            </p>
          </div>

          <div className="text-red-500/70 font-mono uppercase tracking-widest mt-2">
            Press Shift+Enter to reinitialize
          </div>
        </div>
      </div>
    </div>
  );
};
