import React, { useEffect, useRef } from 'react';

interface InputModalProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  borderColorClass?: string;
  testid?: string;
  placeholder?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
  label,
  value,
  onChange,
  onConfirm,
  onCancel,
  borderColorClass = 'border-blue-500', // Default to blue like Search
  testid,
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="absolute bottom-6 left-4 z-50 flex items-start justify-center pointer-events-none">
      <div
        className={`pointer-events-auto bg-zinc-900/95 border ${borderColorClass} shadow-2xl p-4 min-w-[400px] backdrop-blur-sm rounded-sm`}
        role="dialog"
        aria-modal="true"
        data-testid="input-modal"
      >
        <div
          className={`text-sm font-mono mb-2 font-bold uppercase tracking-widest ${borderColorClass.replace('border-', 'text-')}`}
        >
          {label}:
        </div>
        <input
          ref={inputRef}
          data-testid={testid || 'input-modal-input'}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
            // Stop propagation for all keys when in an input modal
            // to prevent the main keyboard handler from processing them
            e.stopPropagation();
          }}
          className={`w-full bg-zinc-800 text-white font-mono text-sm px-3 py-2 border border-zinc-600 outline-none focus:${borderColorClass}`}
          autoFocus
          onBlur={(e) => {
            // Keep focus unless we are unmounting or user explicitly tabbed away (which shouldn't happen much in this game)
            e.target.focus();
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
