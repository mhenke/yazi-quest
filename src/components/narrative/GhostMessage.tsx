import React from 'react';

interface GhostMessageProps {
  text: string;
  signature: string;
  onClose?: () => void;
}

export function GhostMessage({ text, signature, onClose }: GhostMessageProps) {
  return (
    <div
      className="ghost-message fixed bottom-20 right-8 max-w-md p-4 border-l-4 border-cyan-600 bg-gray-900 bg-opacity-90 z-40 animate-slideIn"
      data-testid="ghost-message"
    >
      <p className="text-cyan-400 italic font-mono text-sm">&quot;{text}&quot;</p>
      <p className="text-cyan-600 text-xs mt-2 text-right">{signature}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-cyan-700 hover:text-cyan-500"
        >
          ×
        </button>
      )}
    </div>
  );
}
