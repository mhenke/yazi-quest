import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useGlobalInput } from '../GlobalInputContext';
import { renderInlineCode } from './ui/inlineCode';

interface SuccessToastProps {
  message: string;
  levelTitle: string;
  onDismiss: () => void; // Shift+Enter - advances to next level
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ message, levelTitle, onDismiss }) => {
  // Keyboard handler to advance to next level
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onDismiss(); // Advances to next level
        return true; // Consume event
      }
    },
    [onDismiss],
    { priority: 700 }
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-xs px-4 animate-terminal-fade"
      role="alert"
      data-testid="mission-complete"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-700 border-l-4 border-l-green-500 shadow-2xl p-5 sm:p-6 rounded-none max-h-[calc(100dvh-2rem)] overflow-y-auto text-left font-mono break-words animate-terminal-pop">
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-bold text-white tracking-wide">
          <CheckCircle2 size={18} className="text-green-400 shrink-0" aria-hidden="true" />
          <span>Mission Complete</span>
          {levelTitle && (
            <>
              <span aria-hidden="true" className="text-zinc-500">
                —
              </span>
              <span>{levelTitle}</span>
            </>
          )}
        </h2>

        <div className="mt-3 pt-3 border-t border-dashed border-zinc-800">
          <p className="text-zinc-200 text-sm leading-relaxed">{renderInlineCode(message)}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">Shift+Enter to advance</span>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-9 px-3 py-1.5 border border-green-500/70 bg-green-950/50 text-green-300 hover:bg-green-900/60 hover:text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Continue (Shift+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
