import React from "react";
import { GameState } from "../types";
import { resolvePath, getNodeByPath } from "../utils/fsHelpers";

interface DirectoryHeaderProps {
  state: GameState;
  className?: string;
}

export const DirectoryHeader: React.FC<DirectoryHeaderProps> = ({ state, className }) => {
  const fullPath = resolvePath(state.fs, state.currentPath);
  const displayPath = fullPath.replace("/home/guest", "~");
  
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  const activeFilter = currentDir && state.filters[currentDir.id];
  
  const selectedCount = state.selectedIds.length;

  return (
    <div
      className={`bg-zinc-900/50 border-b border-zinc-800 px-4 py-1.5 flex items-center justify-between font-mono text-xs ${className || ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 select-none uppercase tracking-tighter text-[10px] font-bold">Path</span>
          <span className="text-zinc-100 font-bold tracking-tight">{displayPath}</span>
        </div>
        {activeFilter && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-purple-400 font-bold">
              filter: "{activeFilter}"
            </span>
          </div>
        )}
        {state.findQuery && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-1 h-1 rounded-full bg-blue-500" />
            <span className="text-blue-400 font-bold">
              find: "{state.findQuery}"
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 rounded">
            <span className="text-orange-500 font-black text-[10px]">SELECTED</span>
            <span className="text-orange-400 font-bold">{selectedCount}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
          <div className="flex gap-1.5">
            <span className="text-zinc-500">Sort</span>
            <span className="text-zinc-400">{state.sortBy}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="flex gap-1.5">
            <span className="text-zinc-500">Dir</span>
            <span className="text-zinc-400">{state.sortDirection}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
