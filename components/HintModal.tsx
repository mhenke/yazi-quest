import React from 'react';
import { X, Lightbulb } from 'lucide-react';

interface HintModalProps {
  hint: string;
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, onClose }) => {
  return (
    <div 
      className="absolute bottom-10 left-6 z-40 w-full max-w-sm bg-zinc-900/95 border border-zinc-700 shadow-2xl p-5 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-lg backdrop-blur-sm"
      role="dialog"
      aria-modal="false"
    >
      <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
          aria-label="Close hint"
      >
          <X size={16} />
      </button>
      
      <div className="flex items-center gap-2 text-yellow-500 border-b border-zinc-800 pb-2">
           <Lightbulb size={18} />
           <h2 className="text-sm font-bold tracking-wider uppercase">System Hint</h2>
      </div>
      
      <p className="text-zinc-300 text-xs leading-relaxed font-mono">
          {hint}
      </p>
    </div>
  );
};