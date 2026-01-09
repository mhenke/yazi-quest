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
  const title = isPermanent ? 'Confirm Permanent Deletion' : 'Confirm Trash';
  const detailPrefix = isPermanent ? 'Permanently delete' : 'Send to trash';

  const singleItemName = itemsToDelete.length === 1 ? ` '${itemsToDelete[0]}'` : '';
  const multipleItemsName = itemsToDelete.length > 1 ? ` ${itemsToDelete.length} items` : '';
  const detail = `${detailPrefix}${singleItemName}${multipleItemsName}?`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
    >
      <div
        className={`w-full max-w-4xl border ${isPermanent ? 'border-red-500' : 'border-purple-400'} bg-zinc-900/95 shadow-2xl relative overflow-hidden`}
      >
        <div
          id="confirmation-modal-title"
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-zinc-900 ${isPermanent ? 'text-red-500' : 'text-purple-400'} text-sm font-mono`}
        >
          {title}
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[160px]">
          <p
            id="confirmation-modal-desc"
            className="text-zinc-300 font-mono text-lg text-center mb-4"
          >
            {detail}
          </p>

          {itemsToDelete.length > 1 && (
            <div className="w-full max-h-[60vh] overflow-y-auto bg-zinc-950 border border-zinc-700 rounded p-4 mb-8 text-xs font-mono text-zinc-400 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
              {itemsToDelete.map((name, i) => (
                <div key={i} className="truncate" title={name}>
                  {name}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-12 font-mono text-lg">
            <button
              className="group flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500 rounded px-2 py-1"
              onClick={onConfirm}
              aria-label="Confirm deletion"
            >
              <span
                className={`px-1 font-bold ${isPermanent ? 'bg-red-500 text-white' : 'bg-zinc-200 text-black'}`}
              >
                [Y]
              </span>
              <span className="text-zinc-400 group-hover:text-white">es</span>
            </button>
            <button
              className="group flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500 rounded px-2 py-1"
              onClick={onCancel}
              aria-label="Cancel deletion"
            >
              <span className="text-zinc-500 font-bold">(N)</span>
              <span className="text-zinc-400 group-hover:text-white">o</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
