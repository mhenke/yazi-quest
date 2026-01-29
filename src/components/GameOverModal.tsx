import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { useGlobalInput } from '../GlobalInputContext';

interface GameOverModalProps {
  reason: 'time' | 'keystrokes' | 'honeypot' | 'criticalFile';
  onRestart: () => void;
  efficiencyTip?: string; // Level-specific tip from constants.tsx
  level?: { id: number }; // Optional level context for narrative flavor
  customMessage?: string; // Override narrative with specific error
}

// Narrative failure messages - in-universe flavor text
const getFailureTitle = (reason: GameOverModalProps['reason'], levelId: number = 1): string => {
  switch (reason) {
    case 'time':
      return 'WATCHDOG CYCLE COMPLETE';
    case 'keystrokes':
      // [Watchdog Evolution] Ep III uses IG, not Heuristics
      if (levelId > 10) return 'IG KERNEL PANIC';
      return 'HEURISTIC ANALYSIS COMPLETE';
    case 'honeypot':
      if (levelId > 10) return 'IG HONEYPOT ALERT';
      return 'TRAP ACTIVATED';
    case 'criticalFile':
      if (levelId > 10) return 'IMMUTABILITY VIOLATION';
      return 'SHELL COLLAPSE';
  }
};

const getFailureNarrative = (reason: GameOverModalProps['reason'], levelId: number = 1): string => {
  // Character-specific attribution logic (Watchdog Evolution)
  const getAttribution = () => {
    if (levelId <= 5) return 'Ticket #9942 auto-resolved by Admin M.Reyes.';
    if (levelId <= 10) return 'Heuristic deviation confirmed by Analyst K.Ortega.';
    return 'IG Interception authorized by S.Iqbal (Watchdog v2.0).';
  };

  switch (reason) {
    case 'time':
      return `Watchdog Timer Expired. ${getAttribution()}`;
    case 'keystrokes':
      return `Instruction Analysis Complete. Pattern match confirmed. ${getAttribution()}`;
    case 'honeypot':
      return `TRAP ACTIVATED. Security Incident logged. ${getAttribution()}`;
    case 'criticalFile':
      return `CRITICAL SYSTEM FAILURE. Essential binaries deleted. User environment destabilized. ${getAttribution()}`;
  }
};

const getDefaultEfficiencyTip = (
  reason: GameOverModalProps['reason'],
  levelId: number = 1
): string => {
  switch (reason) {
    case 'time':
      return 'The system traced your connection. Optimize your path and use batch operations.';
    case 'keystrokes':
      // [Watchdog Evolution] Ep III thermal noise tip
      if (levelId > 10) {
        return 'Thermal Spike Detected. Recursive searching (s/find) generates high heat. Use direct jumps (gg/G) to stay cool.';
      }
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
  level,
  customMessage,
}) => {
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onRestart();
        return true;
      }
    },
    [onRestart],
    { priority: 800 }
  );

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
              data-text={getFailureTitle(reason, level?.id)}
            >
              {getFailureTitle(reason, level?.id)}
            </h2>
            <p className="text-red-400 font-mono uppercase tracking-wider text-sm">
              {customMessage || getFailureNarrative(reason, level?.id)}
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-800/50 p-4 rounded w-full">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2 font-bold uppercase text-xs tracking-wider">
              <Zap size={14} />
              <span>Efficiency Protocol</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-mono">
              {efficiencyTip || getDefaultEfficiencyTip(reason, level?.id)}
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
