import React from 'react';

import { GameState } from '../types';

interface ConfirmationModalProps {
  deleteType: GameState['deleteType'];
  itemsToDelete: string[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  deleteType,
  itemsToDelete,
}) => {
  const isPermanent = deleteType === 'permanent';
  const title = isPermanent ? 'Confirm Permanent Deletion' : 'Confirm Trash';
  const detailPrefix = isPermanent ? 'Permanently delete' : 'Send to trash';

  const singleItemName = itemsToDelete.length === 1 ? ` '${itemsToDelete[0]}'` : '';
  const multipleItemsName = itemsToDelete.length > 1 ? ` ${itemsToDelete.length} items` : '';
  const detail = `${detailPrefix}${singleItemName}${multipleItemsName}?`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg border ${isPermanent ? 'border-red-500' : 'border-purple-400'} bg-zinc-900/95 shadow-2xl relative overflow-hidden`}
      >
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-zinc-900 ${isPermanent ? 'text-red-500' : 'text-purple-400'} text-sm font-mono`}
        >
          {title}
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
          <p className="text-zinc-300 font-mono text-lg text-center mb-4">{detail}</p>

          {itemsToDelete.length > 1 && (
            <div className="w-full max-h-32 overflow-y-auto bg-zinc-950 border border-zinc-700 rounded p-2 mb-4 text-xs font-mono text-zinc-400">
              {itemsToDelete.map((name, i) => (
                <div key={i} className="truncate">
                  {name}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-12 font-mono text-lg">
            <div className="group flex items-center gap-1 cursor-default">
              <span
                className={`px-1 font-bold ${isPermanent ? 'bg-red-500 text-white' : 'bg-zinc-200 text-black'}`}
              >
                [Y]
              </span>
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
