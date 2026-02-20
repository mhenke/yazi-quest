import React, { useEffect, useState } from 'react';
import { getBootSequenceForEpisode, type BootSequence } from '../../constants/bootSequences';

interface BootSequenceProps {
  episode: number;
  onComplete?: () => void;
}

/**
 * BootSequence component displays animated boot messages for each episode.
 *
 * Note: When using this component, pass a `key` prop equal to `episode` to ensure
 * the component remounts on episode change, preventing state leakage:
 * <BootSequence key={episode} episode={episode} onComplete={...} />
 */
export function BootSequence({ episode, onComplete }: BootSequenceProps) {
  const [sequence] = useState(() => getBootSequenceForEpisode(episode));
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    const lineDuration = sequence.duration / sequence.lines.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Schedule all lines to appear
    sequence.lines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, index * lineDuration);
      timers.push(timer);
    });

    // Schedule completion
    const completionTimer = setTimeout(() => {
      onComplete?.();
    }, sequence.duration + 1000);
    timers.push(completionTimer);

    // Cleanup
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [sequence, onComplete, episode]);

  return (
    <div className="boot-sequence fixed inset-0 bg-black text-green-500 font-mono p-8 z-50">
      <div className="max-w-2xl">
        {visibleLines.map((line, index) => (
          <div key={index} className="mb-2 animate-fadeIn">
            {line}
          </div>
        ))}
        <div className="animate-pulse mt-4">_</div>
      </div>
    </div>
  );
}
