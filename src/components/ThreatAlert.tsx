import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { renderInlineCode } from './ui/inlineCode';

interface ThreatAlertProps {
  message: string;
  author?: string;
  onDismiss: () => void;
}

export const ThreatAlert: React.FC<ThreatAlertProps> = ({ message, author, onDismiss }) => {
  // Keyboard handling is managed globally in App.tsx to coordinate with game state
  // (e.g. blocking dismissal for Honeypot traps until clipboard is cleared)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xs px-4 animate-terminal-fade"
      role="alert"
      data-testid="threat-alert"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-700 border-l-4 border-l-orange-500 shadow-2xl p-5 sm:p-6 rounded-none max-h-[calc(100dvh-2rem)] overflow-y-auto text-left font-mono break-words animate-terminal-pop">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-white tracking-wide">
          <AlertTriangle size={18} className="text-orange-400 shrink-0" aria-hidden="true" />
          <span>System Alert: Threat Detected</span>
        </h2>

        <div className="mt-3 pt-3 border-t border-dashed border-zinc-800">
          <p className="text-zinc-200 text-sm leading-relaxed">{renderInlineCode(message)}</p>
        </div>

        {author && (
          <div className="mt-2 text-right">
            <span className="text-orange-300 text-xs italic">— {author}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">Esc or Shift+Enter to dismiss</span>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-9 px-3 py-1.5 border border-orange-500/70 bg-orange-950/50 text-orange-300 hover:bg-orange-900/60 hover:text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Dismiss (Shift+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
