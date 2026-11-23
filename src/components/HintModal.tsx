import React from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb } from 'lucide-react';
import { useOverlayFocus } from './useOverlayFocus';

interface HintModalProps {
  hint: string;
  stage: number; // 0=vague, 1=partial, 2=detailed
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, stage, onClose }) => {
  const panelRef = useOverlayFocus();
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
  return createPortal(
    <div
      data-testid="hint-modal"
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="hint-dialog-title"
      className="fixed bottom-10 left-4 right-4 sm:left-6 z-[250] max-h-[calc(100dvh-4rem)] overflow-y-auto max-w-sm bg-zinc-900/95 border border-zinc-700 shadow-2xl p-4 sm:p-5 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-lg backdrop-blur-sm"
      role="dialog"
      aria-modal="false"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 text-yellow-400">
          <Lightbulb size={18} />
          <h2 id="hint-dialog-title" className="text-sm font-bold tracking-wider uppercase">
            {stageLabel}
          </h2>
        </div>
        {stage < 2 && (
          <div className="text-xs text-yellow-400 font-mono uppercase tracking-wider">
            Press Alt+H for more detail
          </div>
        )}
      </div>

      <p className="text-zinc-300 text-xs leading-relaxed font-mono">{displayText}</p>

      <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 font-mono mt-1">
        <span>Shift+Enter or Escape to close</span>
        <button type="button" onClick={onClose} className="text-zinc-300 hover:text-white">
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};
