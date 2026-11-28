import { useCallback, useMemo, type ReactNode } from 'react';
import { getBootSequenceForEpisode } from '../../constants/bootSequences';
import { useGlobalInput } from '../../GlobalInputContext';
import { SkipIntroButton, useSkipIntro, useTypewriter } from './useTypewriter';

export interface BootSequenceProps {
  episode: number;
  cycleCount?: number;
  onComplete?: (options?: { isSkip?: boolean }) => void;
  reduceMotion?: boolean;
}

const renderBootLine = (line: string): ReactNode => {
  if (!line) return '';
  if (line.startsWith('[ OK ]')) {
    return (
      <>
        <span className="text-green-500">[</span>
        <span className="text-green-400 font-bold"> OK </span>
        <span className="text-green-500">]</span>
        {line.substring(6)}
      </>
    );
  }
  return line;
};

export function BootSequence({
  episode,
  cycleCount = 1,
  onComplete,
  reduceMotion,
}: BootSequenceProps) {
  const sequence = useMemo(
    () => getBootSequenceForEpisode(episode, cycleCount),
    [episode, cycleCount]
  );
  const { lines, showContinue, skip } = useTypewriter(sequence.lines, {
    speed: sequence.lineSpeedMs,
    key: `${episode}-${cycleCount}`,
    immediate: reduceMotion,
  });

  const handleComplete = useCallback(
    (options?: { isSkip?: boolean }) => {
      onComplete?.(options);
    },
    [onComplete]
  );

  useSkipIntro(handleComplete);

  useGlobalInput(
    (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (e.shiftKey || showContinue) {
        handleComplete();
      } else {
        skip();
      }
      return true;
    },
    [showContinue, handleComplete, skip],
    { priority: 1000 }
  );

  return (
    <main className="boot-sequence fixed inset-0 z-50 bg-black text-green-500 font-mono p-8 sm:p-12 overflow-y-auto flex flex-col items-start justify-start select-none">
      <div className="w-full max-w-2xl">
        {lines.map((line, index) => (
          <div key={index} className={reduceMotion ? 'min-h-5' : 'min-h-5 animate-fadeIn'}>
            {renderBootLine(line)}
          </div>
        ))}
        <div
          className={`bg-green-500 w-2 h-4 inline-block ml-1 mt-1 ${reduceMotion ? '' : 'animate-pulse'}`}
          aria-hidden="true"
        />
      </div>

      {showContinue && (
        <button
          type="button"
          onClick={() => handleComplete()}
          className="mt-8 text-green-400 hover:text-green-300 font-mono text-sm flex items-center gap-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-400"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true" />
          Press Shift+Enter to continue...
        </button>
      )}

      <SkipIntroButton />
    </main>
  );
}
