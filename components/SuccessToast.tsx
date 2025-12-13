import React, { useEffect } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  levelTitle: string;
  onDismiss: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ message, levelTitle, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500"
      role="alert"
    >
      <div className="bg-green-950/95 border-2 border-green-500 shadow-2xl shadow-green-500/20 px-6 py-4 rounded-lg backdrop-blur-sm min-w-[320px]">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-2 animate-pulse">
            <CheckCircle2 size={24} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-bold uppercase tracking-wider">
              <Zap size={14} />
              Mission Complete
            </div>
            <div className="text-green-300 text-xs font-mono mt-1 opacity-80">
              {levelTitle}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-800">
          <p className="text-green-100 text-sm font-mono font-bold">
            {message}
          </p>
        </div>
        <div className="mt-2 text-[10px] text-green-600 font-mono">
          Press SHIFT+ENTER to continue...
        </div>
      </div>
    </div>
  );
};
