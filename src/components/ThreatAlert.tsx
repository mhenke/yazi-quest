import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] animate-in zoom-in-95 fade-in duration-300"
      role="alert"
    >
      <div className="bg-orange-950/95 border-2 border-orange-500 shadow-2xl shadow-orange-500/20 px-8 py-6 rounded-xl backdrop-blur-md min-w-[360px] max-w-md flex flex-col items-center text-center">
        <div className="bg-orange-500 rounded-full p-3 mb-4 animate-pulse shadow-lg shadow-orange-500/50">
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
          <p className="text-white text-md font-mono font-medium leading-relaxed">{message}</p>
        </div>

        {author && (
          <div className="w-full text-right mt-2 mr-2">
            <span className="text-orange-500/80 font-mono text-xs italic">- {author}</span>
          </div>
        )}

        <div className="mt-4 text-[10px] text-orange-500/70 font-mono uppercase tracking-widest">
          Press Shift+Enter to dismiss
        </div>
      </div>
    </div>
  );
};
