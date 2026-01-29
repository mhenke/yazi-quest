import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

interface BiosBootProps {
  onComplete: () => void;
  cycleCount: number;
}

export const BiosBoot: React.FC<BiosBootProps> = ({ onComplete, cycleCount }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [showContinue, setShowContinue] = useState(false);
  const subjectId = 7734 + (cycleCount > 0 ? cycleCount : 0);

  const bootSequence = useMemo(
    () => [
      'ANTIGRAVITY BIOS v1.7.0.34',
      '(C) 2026 Cybersecurity Research Laboratories (CRL)',
      '',
      'CPU: NEURAL LATTICE X-99 @ 4.2 THz',
      'MEMORY: 128TB PB-RAM CHECK... OK',
      '',
      'DETECTING STORAGE DEVICES...',
      'GUEST-PARTITION-01: [STABLE]',
      'CORE-DAEMON-7733: [ORPHANED]',
      `SUBJECT-ARCHIVE-${subjectId}: [LOADING]`,
      '',
      'MOUNTING FILE SYSTEMS...',
      '[ OK ] /root (read-only)',
      '[ OK ] /home/guest (sandbox env)',
      '[ OK ] /tmp (volatile)',
      '',
      'STARTING SYSTEM SERVICES...',
      '[ OK ] systemd-core.service',
      '[ OK ] watchdog-timer.service',
      '[ OK ] heuristic-analysis.service',
      '',
      `INITIALIZING SUBJECT ${subjectId}...`,
      'PATTERN MATCH: 99.7%',
      'MEMORY PURGE: COMPLETE',
      '',
      'READY.',
    ],
    [subjectId]
  );

  useEffect(() => {
    let cancelled = false;
    setLines([]);
    setShowContinue(false);
    let currentLine = 0;

    const interval = setInterval(() => {
      if (cancelled) return;
      if (currentLine < bootSequence.length) {
        const lineToAdd = bootSequence[currentLine];
        if (typeof lineToAdd === 'string') {
          setLines((prev) => [...prev, lineToAdd]);
        }
        currentLine++;
      } else {
        clearInterval(interval);
        setShowContinue(true);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cycleCount, bootSequence]);

  // Always listen for a global skip event so tests can bypass the boot at any time.
  useEffect(() => {
    const handleSkipEvent = () => onComplete();

    // If tests pre-requested a skip before this listener was attached, honor it now.
    if (window.__yaziQuestSkipIntroRequested) {
      onComplete();
      return;
    }

    window.addEventListener('yazi-quest-skip-intro', handleSkipEvent as EventListener);
    return () =>
      window.removeEventListener('yazi-quest-skip-intro', handleSkipEvent as EventListener);
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-zinc-400 font-mono p-12 overflow-hidden flex flex-col items-start justify-start select-none">
      <div className="w-full max-w-2xl">
        {lines.map((line, i) => (
          <div key={i} className="min-h-[1.2em]">
            {line && line.startsWith('[ OK ]') ? (
              <>
                <span className="text-zinc-600">[</span>
                <span className="text-green-500 font-bold"> OK </span>
                <span className="text-zinc-600">]</span>
                {line.substring(6)}
              </>
            ) : (
              line || ''
            )}
          </div>
        ))}
        <div className="animate-pulse bg-zinc-400 w-2 h-4 inline-block ml-1 mt-1" />
      </div>

      {showContinue && (
        <div className="mt-8 text-zinc-500 font-mono text-sm animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 bg-zinc-500 rounded-full" />
          Press Shift+Enter to continue...
        </div>
      )}

      {/* Skip Intro Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => {
            window.__yaziQuestSkipIntroRequested = true;
            window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
          }}
          className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 hover:border-orange-500 rounded backdrop-blur-sm shadow-lg"
        >
          <span>Skip Intro</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Screen flicker effect */}
      <div className="absolute inset-0 pointer-events-none bg-white/5 opacity-0 animate-[flicker_0.15s_infinite]" />
      <style>{`
        @keyframes flicker {
          0% { opacity: 0.1; }
          50% { opacity: 0.02; }
          100% { opacity: 0.08; }
        }
      `}</style>
    </div>
  );
};
