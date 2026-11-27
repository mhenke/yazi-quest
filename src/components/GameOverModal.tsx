import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { useGlobalInput } from '../GlobalInputContext';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';
import { Scanlines } from './narrative/Scanlines';

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
    if (levelId <= 5) return 'Ticket #9942 closed by M.Reyes.';
    if (levelId <= 10) return 'Deviation flagged by K.Ortega.';
    return 'Interception authorized by S.Iqbal.';
  };

  switch (reason) {
    case 'time':
      return `Timer expired. ${getAttribution()}`;
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
      return 'Inspect suspicious files before yanking or cutting them, and clear your clipboard with Y/X if flagged.';
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
  const panelRef = useOverlayFocus(true, '[data-restart-level]');
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onRestart();
        return true;
      }
    },
    [onRestart],
    { priority: 2500 } // Highest priority - game over restart must override everything
  );

  return (
    <div
      data-testid="game-over-modal"
      className="absolute inset-0 z-[300] flex items-center justify-center bg-red-950/80 px-4 backdrop-blur-xs animate-terminal-fade"
      onKeyDown={containOverlayTab}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        tabIndex={-1}
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-black border-2 border-red-600 shadow-2xl p-4 sm:p-8 text-center relative"
      >
        {/* Scanline bg */}
        <Scanlines className="opacity-20" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-red-500 animate-pulse">
            <AlertTriangle size={64} strokeWidth={1.5} />
          </div>

          <div>
            <h2
              id="game-over-title"
              className="text-3xl font-bold text-red-500 tracking-widest uppercase mb-2 glitch-text"
              data-text={getFailureTitle(reason, level?.id)}
              data-testid="game-over-title"
            >
              {getFailureTitle(reason, level?.id)}
            </h2>
            <p className="text-red-400 font-mono uppercase tracking-wider text-sm">
              {customMessage || getFailureNarrative(reason, level?.id)}
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-none w-full">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2 font-bold uppercase text-xs tracking-wider">
              <Zap size={14} />
              <span>Efficiency Protocol</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-mono">
              {efficiencyTip || getDefaultEfficiencyTip(reason, level?.id)}
            </p>
          </div>

          <button
            type="button"
            onClick={onRestart}
            data-restart-level
            className="border border-red-600 px-3 py-2 text-sm text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Reinitialize (Shift+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
