import React from "react";
import { KEYBINDINGS, META_KEYBINDINGS } from "../constants";

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose: _onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl md:max-w-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 relative max-h-[80vh] overflow-auto">
        <div className="mb-6 border-b border-zinc-800 pb-2">
          <h2 className="text-xl font-bold text-orange-500 tracking-wider">HELP / KEYBINDINGS</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-2">Core Yazi Commands</h3>
            <div className="space-y-2">
              {KEYBINDINGS.map((binding, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-1 rounded">
                  <span className="text-zinc-400">{binding.description}</span>
                  <div className="flex gap-1">
                    {binding.keys.map(k => (
                      <span
                        key={k}
                        className="min-w-[24px] text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300 font-mono text-xs font-bold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-yellow-400 mb-2">Game Meta Commands</h3>
            <div className="space-y-2">
              {META_KEYBINDINGS.map((binding, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-1 rounded">
                  <span className="text-zinc-400">{binding.description}</span>
                  <div className="flex gap-1">
                    {binding.keys.map(k => (
                      <span
                        key={k}
                        className="min-w-[36px] text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300 font-mono text-xs font-bold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-600 font-mono">
          Query command reference (?) • Press Esc to close
        </div>
      </div>
    </div>
  );
};
