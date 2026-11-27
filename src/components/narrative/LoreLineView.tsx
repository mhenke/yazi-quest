import React from 'react';
import type { LoreLine, LoreTone } from '../../types';
import { type SlicedLoreRun, sliceLoreSection } from '../../utils/loreHelpers';

const LORE_TONE_CLASSES: Record<LoreTone, string> = {
  'ai-7734': 'text-orange-400 font-bold',
  'ai-7733': 'text-blue-400 font-bold',
  'ai-7735': 'text-yellow-400 font-bold',
  danger: 'text-red-500 font-bold',
  warning: 'text-orange-400 font-bold',
  signal: 'text-orange-400 font-semibold',
  caution: 'text-yellow-300 font-semibold',
};

export const renderSlicedLoreLine = (
  runs: SlicedLoreRun[],
  reduceMotion?: boolean
): React.ReactNode =>
  runs.map((run, idx) => {
    if (!run.tone) {
      return <React.Fragment key={idx}>{run.text}</React.Fragment>;
    }
    const baseClass = LORE_TONE_CLASSES[run.tone];
    const isGlitch = run.glitch && !reduceMotion;
    return (
      <span
        key={idx}
        className={isGlitch ? `${baseClass} glitch-text-2` : baseClass}
        data-text={isGlitch ? run.text : undefined}
      >
        {run.text}
      </span>
    );
  });

export const renderFullLoreLine = (line: LoreLine, reduceMotion?: boolean): React.ReactNode =>
  renderSlicedLoreLine(sliceLoreSection([line], Number.POSITIVE_INFINITY)[0] ?? [], reduceMotion);
