import React, { useEffect } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  levelTitle: string;
  onDismiss: () => void; // Enter - advances to next level
  onClose: () => void; // Escape - just dismisses modal
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  levelTitle,
  onDismiss,
  onClose,
}) => {
  // Keyboard handler for dismiss/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss(); // Advances to next level
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose(); // Just dismisses modal, allows continued play
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss, onClose]);

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] animate-in zoom-in-95 fade-in duration-300"
      role="alert"
    >
      <div className="bg-green-950/95 border-2 border-green-500 shadow-2xl shadow-green-500/20 px-8 py-6 rounded-xl backdrop-blur-md min-w-[360px] max-w-md flex flex-col items-center text-center">
        <div className="bg-green-500 rounded-full p-3 mb-4 animate-pulse shadow-lg shadow-green-500/50">
          <CheckCircle2 size={32} className="text-black" />
        </div>

        <div className="space-y-1 mb-4 w-full">
          <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
            <Zap size={12} />
            Mission Complete
          </div>
          <div className="text-green-200 text-xl font-mono font-bold">{levelTitle}</div>
        </div>

        <div className="w-full border-t border-green-800/50 pt-4 mb-2">
          <p className="text-white text-md font-mono font-medium leading-relaxed">{message}</p>
        </div>

        <div className="mt-4 text-[10px] text-green-500/70 font-mono uppercase tracking-widest animate-pulse">
          Press Enter to continue
        </div>
      </div>
    </div>
  );
};
