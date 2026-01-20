import React, { useEffect, useState } from 'react';

interface BiosBootProps {
  onComplete: () => void;
  cycleCount: number;
}

export const BiosBoot: React.FC<BiosBootProps> = ({ onComplete, cycleCount }) => {
  const [lines, setLines] = useState<string[]>([]);
  const subjectId = 7734 + (cycleCount > 0 ? cycleCount : 0);

  const bootSequence = [
    'ANTIGRAVITY BIOS v1.7.0.34',
    '(C) 2026 LABORATORIES INTERNAL',
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
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootSequence.length) {
        setLines((prev) => [...prev, bootSequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black text-zinc-400 font-mono p-12 overflow-hidden flex flex-col items-start justify-start select-none">
      <div className="w-full max-w-2xl">
        {lines.map((line, i) => (
          <div key={i} className="min-h-[1.2em]">
            {line.startsWith('[ OK ]') ? (
              <>
                <span className="text-zinc-600">[</span>
                <span className="text-green-500 font-bold"> OK </span>
                <span className="text-zinc-600">]</span>
                {line.substring(6)}
              </>
            ) : (
              line
            )}
          </div>
        ))}
        <div className="animate-pulse bg-zinc-400 w-2 h-4 inline-block ml-1 mt-1" />
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
