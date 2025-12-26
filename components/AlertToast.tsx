import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertToastProps {
  message: string;
  levelTitle: string;
  onDismiss: () => void; // keep API similar to SuccessToast
  onClose: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  message,
  levelTitle,
  onDismiss,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] animate-in zoom-in-95 fade-in duration-300"
      role="alert"
    >
      <div className="bg-red-950/95 border-2 border-red-600 shadow-2xl shadow-red-600/20 px-8 py-6 rounded-xl backdrop-blur-md min-w-[360px] max-w-md flex flex-col items-center text-center">
        <div className="bg-red-600 rounded-full p-3 mb-4 animate-pulse shadow-lg shadow-red-600/50">
          <AlertTriangle size={32} className="text-black" />
        </div>

        <div className="space-y-1 mb-4 w-full">
          <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
            <AlertTriangle size={12} />
            Quarantine Alert
          </div>
          <div className="text-red-200 text-xl font-mono font-bold">{levelTitle}</div>
        </div>

        <div className="w-full border-t border-red-800/50 pt-4 mb-2">
          <p className="text-white text-md font-mono font-medium leading-relaxed">{message}</p>
        </div>

        <div className="mt-4 text-[10px] text-red-500/70 font-mono uppercase tracking-widest animate-pulse">
          Press ENTER or ESC to dismiss
        </div>
      </div>
    </div>
  );
};
