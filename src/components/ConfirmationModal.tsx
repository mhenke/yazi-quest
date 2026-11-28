import React from 'react';

import { GameState } from '../types';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

export interface ConfirmationModalProps {
  deleteType: GameState['deleteType'];
  itemsToDelete: string[];
  itemKind?: 'file' | 'folder' | 'item';
  onConfirm: () => void;
  onCancel: () => void;
}

const confirmButtonClass = (isPermanent: boolean): string =>
  `px-2 py-0.5 font-bold border transition-colors ${isPermanent ? 'border-red-500/80 text-red-300 group-hover:bg-red-600 group-hover:text-white' : 'border-zinc-600 text-zinc-200 group-hover:bg-zinc-700 group-hover:text-white'}`;

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  deleteType,
  itemsToDelete,
  itemKind = 'file',
  onConfirm,
  onCancel,
}) => {
  const isPermanent = deleteType === 'permanent';
  const panelRef = useOverlayFocus(true, '[data-cancel-delete]');

  const count = itemsToDelete.length;
  const action = isPermanent ? 'Delete' : 'Trash';
  const suffix = count === 1 ? itemKind : `${itemKind}s`;
  const title = `${action} ${count} selected ${suffix}?`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs"
      onKeyDown={containOverlayTab}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-files"
        tabIndex={-1}
        className={`w-full max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto border ${isPermanent ? 'border-red-500' : 'border-purple-400'} bg-zinc-900/95 shadow-2xl relative`}
      >
        <div
          id="confirmation-modal-title"
          className={`px-4 pt-3 text-center ${isPermanent ? 'text-red-400' : 'text-purple-400'} text-sm font-mono`}
        >
          {title}
        </div>

        <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
          <div
            id="confirmation-modal-files"
            className="w-full max-h-[60vh] overflow-y-auto mb-8 text-lg font-mono text-zinc-400 grid grid-cols-1 gap-y-1 justify-items-center"
          >
            {itemsToDelete.map((name, i) => (
              <div key={i} className="truncate max-w-full">
                {name}
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex gap-6 sm:gap-16 font-mono text-xl w-full justify-center border-t border-zinc-800 pt-4 sm:pt-8 mt-auto">
            <button
              type="button"
              className="group flex items-center gap-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              onClick={onConfirm}
              aria-label="Confirm deletion"
            >
              <span className={confirmButtonClass(isPermanent)}>[Y]</span>
              <span className="text-zinc-300 group-hover:text-white ml-0.5">es</span>
            </button>
            <button
              type="button"
              className="group flex items-center gap-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              data-cancel-delete
              onClick={onCancel}
              aria-label="Cancel deletion"
            >
              <span className="bg-zinc-200 text-black font-bold px-2 py-0.5">(N)</span>
              <span className="text-zinc-200 group-hover:text-white ml-0.5">o</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
