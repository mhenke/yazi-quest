import React, { ReactNode, useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

interface WarningModalProps {
  allowAutoFix: boolean;
  onDismiss?: () => void;
  detectedText: string;
  note?: string;
  icon: ReactNode;
  correctiveAction: ReactNode;
  autoFixText?: string;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  allowAutoFix,
  onDismiss,
  detectedText,
  note,
  icon,
  correctiveAction,
  autoFixText = 'to auto-fix baseline.',
}) => {
  const panelRef = useOverlayFocus();
  const id = useId();
  return (
    <div
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-xs animate-terminal-fade"
      onKeyDown={containOverlayTab}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        tabIndex={-1}
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border-2 border-yellow-600 shadow-[0_0_30px_rgba(202,138,4,0.3)] p-4 sm:p-8 text-center relative rounded-none"
      >
        <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-yellow-500 animate-pulse">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>

          <div className="space-y-3 w-full">
            <h2
              id={`${id}-title`}
              className="text-2xl font-bold text-white tracking-widest uppercase"
            >
              Protocol Violation
            </h2>
            <p id={`${id}-description`} className="text-zinc-400 font-mono text-sm">
              {detectedText}
            </p>
            {note && (
              <div className="w-full bg-yellow-950/20 border border-yellow-600/40 p-3 rounded-none">
                <p className="text-yellow-300 font-mono text-sm font-semibold">{note}</p>
              </div>
            )}
          </div>

          <div className="bg-black/40 border border-zinc-700 p-4 rounded-none w-full flex items-center gap-4">
            <div className="bg-zinc-800 p-2 rounded-none border border-zinc-700">{icon}</div>
            <div className="text-left">
              <p className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-1">
                Corrective Action
              </p>
              <div className="text-zinc-300 text-xs font-mono">{correctiveAction}</div>
            </div>
          </div>

          <div className="w-full flex justify-center mt-2">
            {allowAutoFix ? (
              <p className="text-zinc-400 text-xs font-mono tracking-wide">
                Or press{' '}
                <span className="bg-zinc-800 border border-yellow-500/60 text-yellow-300 px-2 py-0.5 rounded-xs font-bold mx-1">
                  Shift+Enter
                </span>{' '}
                {autoFixText}
              </p>
            ) : (
              <p className="text-zinc-400 text-xs font-mono tracking-wide">
                Press <span className="font-bold text-zinc-200">Esc</span> or{' '}
                <span className="font-bold text-zinc-200">Shift+Enter</span> to close, then apply
                the Yazi fix manually.
              </p>
            )}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-6 px-2 py-1 text-sm text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
