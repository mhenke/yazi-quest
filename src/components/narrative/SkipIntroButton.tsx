import React from 'react';
import { ArrowRight } from 'lucide-react';
import { setSkipIntroRequested } from '../../utils/skipIntroFlag';

interface SkipIntroButtonProps {
  className?: string;
}

export const SkipIntroButton: React.FC<SkipIntroButtonProps> = ({ className }) => {
  return (
    <div className={className || 'absolute top-4 right-4'}>
      <button
        onClick={() => {
          setSkipIntroRequested();
          window.dispatchEvent(new CustomEvent('yazi-quest-skip-intro'));
        }}
        className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 hover:border-orange-500 rounded backdrop-blur-sm shadow-lg"
      >
        <span>Skip Intro</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
