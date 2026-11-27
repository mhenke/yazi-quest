import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ThreatAlertProps {
  message: string;
  author?: string;
  onDismiss: () => void;
}

export const ThreatAlert: React.FC<ThreatAlertProps> = ({
  message,
  author,
  onDismiss: _onDismiss,
}) => {
  // Keyboard handling is managed globally in App.tsx to coordinate with game state
  // (e.g. blocking dismissal for Honeypot traps until clipboard is cleared)

  return (
    <div
      className="fixed top-1/2 left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4 z-[200] animate-terminal-pop"
      role="alert"
      data-testid="threat-alert"
    >
      <div className="bg-orange-950/95 border-2 border-orange-500 shadow-2xl px-4 sm:px-8 py-4 sm:py-6 rounded-none max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col items-center text-center break-words">
        <div className="bg-orange-500 rounded-none border border-orange-400 p-3 mb-4 animate-pulse">
          <AlertTriangle size={32} className="text-black" />
        </div>

        <div className="space-y-1 mb-4 w-full">
          <div className="flex items-center justify-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest">
            <AlertTriangle size={12} />
            System Alert
          </div>
          <div className="text-orange-200 text-xl font-mono font-bold">Threat Detected</div>
        </div>

        <div className="w-full border-t border-orange-800/50 pt-4 mb-2">
          <p className="text-white text-sm sm:text-base font-mono font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {author && (
          <div className="w-full text-right mt-2 mr-2">
            <span className="text-orange-300 font-mono text-xs italic">- {author}</span>
          </div>
        )}

        <div className="mt-4 text-xs text-orange-400 font-mono uppercase tracking-widest">
          Press Shift+Enter to dismiss
        </div>
      </div>
    </div>
  );
};
