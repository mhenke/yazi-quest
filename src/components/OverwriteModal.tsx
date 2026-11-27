import React from 'react';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

interface OverwriteModalProps {
  fileName: string;
  onDecision: (key: 'y' | 'n') => void;
}

export const OverwriteModal: React.FC<OverwriteModalProps> = ({ fileName, onDecision }) => {
  const panelRef = useOverlayFocus(true, '[data-cancel-overwrite]');
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs"
      onKeyDown={containOverlayTab}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="overwrite-title"
        aria-describedby="overwrite-path"
        tabIndex={-1}
        className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto border border-purple-400 bg-zinc-900/95 shadow-2xl rounded-none"
      >
        <h2
          id="overwrite-title"
          className="px-4 pt-3 text-center text-purple-400 text-sm font-mono"
        >
          Overwrite file?
        </h2>

        <div className="p-4 sm:p-8 flex flex-col items-center justify-center">
          <p className="text-zinc-300 font-mono text-lg text-center mb-2">
            Will overwrite the following file:
          </p>

          <p
            id="overwrite-path"
            className="text-zinc-400 font-mono text-sm text-center break-all mb-8 max-w-full px-4"
          >
            {fileName}
          </p>

          <div className="w-full h-px bg-purple-500/30 mb-4"></div>

          <div className="flex gap-6 sm:gap-20 font-mono text-lg w-full justify-center">
            <button
              type="button"
              onClick={() => onDecision('y')}
              className="bg-zinc-200 px-3 py-0.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label="Overwrite file"
            >
              <span className="font-bold">[Y]</span>es
            </button>
            <button
              type="button"
              onClick={() => onDecision('n')}
              data-cancel-overwrite
              className="px-3 py-0.5 text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label="Cancel overwrite"
            >
              <span className="font-bold">(N)</span>o
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
