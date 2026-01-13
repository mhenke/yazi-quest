import React from 'react';

import { GameState } from '../types';

interface ConfirmationModalProps {
  deleteType: GameState['deleteType'];
  itemsToDelete: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  deleteType,
  itemsToDelete,
  onConfirm,
  onCancel,
}) => {
  const isPermanent = deleteType === 'permanent';

  // Construct the question for the border title
  const count = itemsToDelete.length;
  const action = isPermanent ? 'Delete' : 'Trash';
  const suffix = count === 1 ? 'file' : 'files';
  const title = `${action} ${count} selected ${suffix}?`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className={`w-full max-w-4xl border ${isPermanent ? 'border-red-500' : 'border-purple-400'} bg-zinc-900/95 shadow-2xl relative`}
      >
        {/* Border Title */}
        <div
          id="confirmation-modal-title"
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-zinc-900 ${isPermanent ? 'text-red-500' : 'text-purple-400'} text-sm font-mono whitespace-nowrap`}
        >
          {title}
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          {/* File List / Paths */}
          <div className="w-full max-h-[60vh] overflow-y-auto mb-8 text-lg font-mono text-zinc-400 grid grid-cols-1 gap-y-1 justify-items-center">
            {itemsToDelete.map((name, i) => (
              <div key={i} className="truncate max-w-full">
                {name}
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex gap-16 font-mono text-xl w-full justify-center border-t border-zinc-800 pt-8 mt-auto">
            <button
              className="group flex items-center gap-0 focus:outline-none"
              onClick={onConfirm}
              aria-label="Confirm deletion"
              autoFocus
            >
              <div
                className={`px-2 py-0.5 font-bold ${isPermanent ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'}`}
              >
                [Y]
              </div>
              <span className="text-gray-400 group-hover:text-white ml-0.5">es</span>
            </button>
            <button
              className="group flex items-center gap-0 focus:outline-none"
              onClick={onCancel}
              aria-label="Cancel deletion"
            >
              <div className="text-zinc-500 font-bold px-2 py-0.5">(N)</div>
              <span className="text-zinc-500 group-hover:text-white ml-0.5">o</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
