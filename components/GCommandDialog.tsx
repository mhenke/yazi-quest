import React from 'react';

interface GCommandDialogProps {
  onClose: () => void;
  right?: string;
  left?: string;
}

export const GCommandDialog: React.FC<GCommandDialogProps> = ({ onClose, right, left }) => {
  return (
    <div
      className="absolute bottom-16 z-50 bg-zinc-900/95 border border-zinc-700 shadow-2xl p-4 backdrop-blur-sm rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ left: left || 'calc(16rem + 0.5rem)', right: right || 'calc(50% - 8rem)' }}
      role="dialog"
      aria-modal="false"
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono">
        {/* Left Column */}
        <div className="space-y-1">
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">h</span>
            <span className="text-zinc-300">Go to home</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">w</span>
            <span className="text-zinc-300">Go to workspace</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">g</span>
            <span className="text-zinc-300">Go to top</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1">
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">c</span>
            <span className="text-zinc-300">Go to config</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">d</span>
            <span className="text-zinc-300">Go to datastore</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 font-bold w-8">G</span>
            <span className="text-zinc-300">Go to bottom</span>
          </div>
        </div>
      </div>

      {/* Spacer line */}
      <div className="border-t border-zinc-800 my-2"></div>

      {/* Additional commands */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono">
        <div className="flex gap-3">
          <span className="text-orange-500 font-bold w-8">t</span>
          <span className="text-zinc-300">Go to tmp</span>
        </div>
        <div className="flex gap-3">
          <span className="text-orange-500 font-bold w-8">i</span>
          <span className="text-zinc-300">Go to incoming</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono mt-1">
        <div className="flex gap-3">
          <span className="text-orange-500 font-bold w-8">r</span>
          <span className="text-zinc-300">Go to root</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-zinc-600 font-mono mt-3">
        Press any key to continue or 'g' command
      </div>
    </div>
  );
};
