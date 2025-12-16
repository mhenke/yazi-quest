import React from 'react';

interface ConfirmationModalProps {
  title: string;
  detail: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, detail }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-purple-400 bg-zinc-900/95 shadow-2xl relative overflow-hidden">
        {/* Title Bar integrated into border look */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-zinc-900 text-purple-400 text-sm font-mono">
            {title}
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
            <p className="text-zinc-300 font-mono text-lg text-center break-all mb-8">
                {detail}
            </p>

            <div className="flex gap-12 font-mono text-lg">
                <div className="group flex items-center gap-1 cursor-default">
                    <span className="bg-zinc-200 text-black px-1 font-bold">[Y]</span>
                    <span className="text-zinc-400 group-hover:text-white">es</span>
                </div>
                <div className="group flex items-center gap-1 cursor-default">
                    <span className="text-zinc-500 font-bold">(N)</span>
                    <span className="text-zinc-400 group-hover:text-white">o</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};