import React, { useId } from 'react';
import { containOverlayTab, useOverlayFocus } from './useOverlayFocus';

interface InputModalProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  borderColorClass?: string;
  labelColorClass?: string;
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
  labelColorClass = 'text-blue-500',
  testid,
  placeholder,
}) => {
  const labelId = useId();
  const panelRef = useOverlayFocus(true, 'input');

  return (
    <div
      className="absolute bottom-4 inset-x-4 z-50 flex justify-center pointer-events-none sm:bottom-6"
      onKeyDown={containOverlayTab}
    >
      <div
        ref={panelRef}
        className={`pointer-events-auto w-full max-w-md bg-zinc-900/95 border ${borderColorClass} shadow-2xl p-4 backdrop-blur-xs rounded-xs`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${labelId}-label`}
        tabIndex={-1}
        data-testid="input-modal"
      >
        <label
          id={`${labelId}-label`}
          htmlFor={labelId}
          className={`block text-sm font-mono mb-2 font-bold uppercase tracking-widest ${labelColorClass}`}
        >
          {label}:
        </label>
        <input
          id={labelId}
          data-testid={testid || 'input-modal-input'}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
            if (e.key !== 'Tab') e.stopPropagation();
          }}
          className="w-full bg-zinc-800 text-white font-mono text-sm px-3 py-2 border border-zinc-600 outline-hidden focus:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
