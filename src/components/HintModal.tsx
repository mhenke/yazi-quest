import React from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb } from 'lucide-react';
import { useOverlayFocus } from './useOverlayFocus';
import { renderInlineCode } from './ui/inlineCode';
import type { HintStages } from '../types';

interface HintModalProps {
  hint: HintStages;
  stage: number;
  onClose: () => void;
  onNextStage: () => void;
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}

const HINT_STAGE_KEYS = ['nudge', 'command', 'walkthrough'] as const;
const HINT_STAGE_LABELS = [
  'Hint (1/3 • Nudge)',
  'Hint (2/3 • Command)',
  'Hint (3/3 • Walkthrough)',
];

const HINT_CHIP_CLASS = 'bg-zinc-800/90 text-zinc-100 px-1 py-0.5 rounded-xs font-mono';

export const HintModal: React.FC<HintModalProps> = ({
  hint,
  stage,
  onClose,
  onNextStage,
  returnFocusTo,
}) => {
  const panelRef = useOverlayFocus(true, undefined, returnFocusTo);
  const clampedStage = Math.max(0, Math.min(2, stage));
  const displayText = hint[HINT_STAGE_KEYS[clampedStage]];
  const stageLabel = HINT_STAGE_LABELS[clampedStage];

  return createPortal(
    <div
      data-testid="hint-modal"
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="hint-dialog-title"
      className="fixed bottom-14 left-4 right-4 sm:left-6 z-[250] max-h-[calc(100dvh-5rem)] overflow-y-auto max-w-md bg-zinc-900/95 border border-zinc-700 shadow-2xl p-4 sm:p-5 flex flex-col gap-3 animate-terminal-rise rounded-none backdrop-blur-xs"
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
      </div>

      <p className="text-zinc-200 text-xs leading-relaxed font-mono">
        {renderInlineCode(displayText, HINT_CHIP_CLASS)}
      </p>

      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-400 font-mono mt-1">
        <span>Practice keys while open · Esc to close</span>
        <div className="flex items-center gap-3">
          {clampedStage < 2 && onNextStage && (
            <button
              type="button"
              onClick={onNextStage}
              className="min-h-9 px-3 py-1.5 border border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              More detail (Alt+H)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 px-3 py-1.5 text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
