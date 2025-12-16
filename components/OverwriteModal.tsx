import React from 'react';

interface OverwriteModalProps {
  fileName: string;
}

export const OverwriteModal: React.FC<OverwriteModalProps> = ({ fileName }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl border border-purple-400 bg-zinc-900/95 shadow-2xl relative overflow-hidden rounded-md">
        
        {/* Top Label */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-zinc-900 text-purple-400 text-sm font-mono z-10">
            Overwrite file?
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
            <p className="text-zinc-300 font-mono text-lg text-center mb-2">
                Will overwrite the following file:
            </p>
            
            <p className="text-zinc-400 font-mono text-sm text-center break-all mb-8 max-w-full px-4">
                {fileName}
            </p>

            <div className="w-full h-px bg-purple-500/30 mb-4"></div>

            <div className="flex gap-20 font-mono text-lg w-full justify-center">
                <div className="group flex items-center justify-center gap-0 cursor-default bg-zinc-200 px-3 py-0.5 text-black min-w-[80px]">
                    <span className="font-bold">[Y]</span>
                    <span>es</span>
                </div>
                <div className="group flex items-center justify-center gap-0 cursor-default text-zinc-500 min-w-[80px]">
                    <span className="font-bold">(N)</span>
                    <span>o</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};