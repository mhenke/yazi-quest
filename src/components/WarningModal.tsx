import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface WarningModalProps {
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
  detectedText,
  note,
  icon,
  correctiveAction,
  autoFixText = 'to auto-fix baseline.',
}) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-yellow-600 shadow-[0_0_30px_rgba(202,138,4,0.3)] p-8 max-w-md text-center relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-yellow-500 animate-pulse">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>

          <div className="space-y-3 w-full">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
              Protocol Violation
            </h2>
            <p className="text-zinc-400 font-mono text-sm">{detectedText}</p>
            {note && (
              <div className="w-full bg-yellow-900/10 border-l-4 border-yellow-600 p-3 rounded">
                <p className="text-yellow-300 font-mono text-sm font-semibold">{note}</p>
              </div>
            )}
          </div>

          <div className="bg-black/40 border border-zinc-700 p-4 rounded w-full flex items-center gap-4">
            <div className="bg-zinc-800 p-2 rounded-full">{icon}</div>
            <div className="text-left">
              <p className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-1">
                Corrective Action
              </p>
              <div className="text-zinc-300 text-xs font-mono">{correctiveAction}</div>
            </div>
          </div>

          <div className="w-full flex justify-center mt-4">
            {allowAutoFix ? (
              <p className="text-zinc-300 text-base font-mono font-semibold tracking-wide">
                Press{' '}
                <span className="bg-yellow-500 text-black px-3 py-1 rounded font-extrabold mx-2 text-sm">
                  Shift+Enter
                </span>{' '}
                {autoFixText}
              </p>
            ) : (
              <p className="text-zinc-500 text-sm font-mono tracking-wide">
                Press <span className="font-bold text-zinc-300">Shift+Enter</span> to close, then
                apply fix manually.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
