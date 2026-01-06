import React from 'react';
import { ListOrdered, AlertTriangle } from 'lucide-react';

export const SortWarningModal: React.FC = () => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-2 border-yellow-600 shadow-[0_0_30px_rgba(202,138,4,0.3)] p-8 max-w-md text-center relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-yellow-500 animate-pulse">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
              Protocol Violation
            </h2>
            <p className="text-zinc-400 font-mono text-sm">
              Non-standard sorting detected. Operational integrity compromised.
            </p>
          </div>

          <div className="bg-black/40 border border-zinc-700 p-4 rounded w-full flex items-center gap-4">
            <div className="bg-zinc-800 p-2 rounded-full">
              <ListOrdered size={20} className="text-zinc-400" />
            </div>
            <div className="text-left">
              <p className="text-yellow-500 font-bold text-[10px] uppercase tracking-wider mb-1">
                Corrective Action
              </p>
              <p className="text-zinc-300 text-xs font-mono">
                Press{' '}
                <span className="bg-zinc-200 text-black px-1.5 py-0.5 rounded font-bold mx-1">
                  ,n
                </span>{' '}
                to reset sort to natural (ascending) and continue...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
