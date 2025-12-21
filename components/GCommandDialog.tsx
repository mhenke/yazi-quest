import React from 'react';

interface GCommandDialogProps {
  onClose: () => void;
}

export const GCommandDialog: React.FC<GCommandDialogProps> = ({ _onClose }) => {
  return (
    <div 
      className="absolute bottom-16 left-0 right-0 mx-auto w-fit bg-zinc-900/95 border border-zinc-700 shadow-2xl p-4 backdrop-blur-sm z-50 rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
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
        Press any key to continue or &apos;g&apos; command
      </div>
    </div>
  );
};
