import React from 'react';
import { Lightbulb } from 'lucide-react';

interface HintModalProps {
  hint: string;
  stage: number; // 0=vague, 1=partial, 2=detailed
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, stage, onClose }) => {
  // Parse hint into progressive stages
  // Split by sentence or period, show increasing amounts
  const sentences = hint.split(/\.\s+/).filter((s) => s.trim());

  let displayText = '';
  if (stage === 0 && sentences.length > 0) {
    // Vague: First sentence only or just the goal
    displayText = sentences[0] + '.';
  } else if (stage === 1 && sentences.length > 1) {
    // Partial: First half of instructions
    const midpoint = Math.ceil(sentences.length / 2);
    displayText = sentences.slice(0, midpoint).join('. ') + '.';
  } else {
    // Detailed: Full walkthrough
    displayText = hint;
  }

  const stageLabels = ['Hint (Vague)', 'Hint (Partial)', 'Hint (Detailed)'];
  const stageLabel = stageLabels[stage] || stageLabels[2];
  return (
    <div
      className="absolute bottom-10 left-6 z-40 w-full max-w-sm bg-zinc-900/95 border border-zinc-700 shadow-2xl p-5 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-lg backdrop-blur-sm"
      role="dialog"
      aria-modal="false"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 text-yellow-500">
          <Lightbulb size={18} />
          <h2 className="text-sm font-bold tracking-wider uppercase">{stageLabel}</h2>
        </div>
        {stage < 2 && (
          <div className="text-[9px] text-yellow-600 font-mono uppercase tracking-wider animate-pulse">
            Press Ctrl+Shift+H for more detail
          </div>
        )}
      </div>

      <p className="text-zinc-300 text-xs leading-relaxed font-mono">{displayText}</p>

      <div className="text-center text-[10px] text-zinc-600 font-mono mt-1">Press Esc to close</div>
    </div>
  );
};