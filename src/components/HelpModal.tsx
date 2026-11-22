import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import { HELP_KEYBINDINGS, HELP_META_KEYBINDINGS } from '../constants/keybindings';
import type { Action } from '../hooks/gameReducer';

interface HelpModalProps {
  onClose: () => void;
  scrollPosition: number;
  dispatch?: React.Dispatch<Action>;
  narrativeEffects?: 'full' | 'reduced' | 'minimal';
}

const LINE_HEIGHT = 20; // Approximate line height in pixels

const FOCUSABLE_SELECTOR =
  'button, select, input, textarea, [href], [tabindex]:not([tabindex="-1"])';

export const HelpModal: React.FC<HelpModalProps> = ({
  onClose,
  scrollPosition,
  dispatch,
  narrativeEffects = 'full',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the dialog when it opens; restore the caller's focus when it closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // scrollPosition (driven by j/k/J/K from the global help-mode handler) maps to
  // the panel, which is the element that actually scrolls.
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = scrollPosition * LINE_HEIGHT;
    }
  }, [scrollPosition]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof HELP_KEYBINDINGS>();
    for (const binding of HELP_KEYBINDINGS) {
      const list = map.get(binding.group);
      if (list) list.push(binding);
      else map.set(binding.group, [binding]);
    }
    return [...map.entries()];
  }, []);

  // Keep Tab/Shift+Tab inside the dialog while it is open.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const atPanel = active === panelRef.current;
    if (e.shiftKey && (atPanel || active === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (atPanel || active === last)) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        data-testid="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabIndex={-1}
        className="w-full max-w-4xl md:max-w-6xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 relative max-h-[80vh] overflow-auto focus:outline-none"
      >
        <div className="mb-6 border-b border-zinc-800 pb-2 flex items-center justify-between gap-4">
          <h2 id="help-modal-title" className="text-xl font-bold text-orange-500 tracking-wider">
            HELP / KEYBINDINGS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-6 px-2 py-1 border border-zinc-700 text-xs font-bold tracking-wider text-zinc-300 hover:text-orange-400 hover:border-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            title="Close (Esc)"
          >
            CLOSE
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-3">Core Yazi Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
              {groups.map(([group, bindings]) => (
                <section key={group}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5 border-b border-zinc-800 pb-1">
                    {group}
                  </h4>
                  <ul className="flex flex-col gap-y-1">
                    {bindings.map((binding) => (
                      <li
                        key={binding.keys.join('+')}
                        className="flex items-start justify-between gap-2 text-sm p-1 rounded"
                      >
                        <span className="text-zinc-400">{binding.description}</span>
                        <span className="flex gap-1 flex-wrap justify-end shrink-0">
                          {binding.keys.map((k) => (
                            <span
                              key={k}
                              className="min-w-[24px] text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300 font-mono text-xs font-bold"
                            >
                              {k}
                            </span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-yellow-400 mb-2">Game Meta Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
              {HELP_META_KEYBINDINGS.map((binding, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-1 rounded">
                  <span className="text-zinc-400">{binding.description}</span>
                  <div className="flex gap-1">
                    {binding.keys.map((k) => (
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

        {dispatch && (
          <div className="mt-6 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-bold text-purple-400 mb-2">Accessibility Settings</h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="narrative-effects-select" className="text-sm text-zinc-400">
                Narrative Effects (glitches, screen effects)
              </label>
              <select
                id="narrative-effects-select"
                value={narrativeEffects}
                onChange={(e) => {
                  dispatch({
                    type: 'UPDATE_SETTINGS',
                    payload: { narrativeEffects: e.target.value as 'full' | 'reduced' | 'minimal' },
                  });
                }}
                className="w-full max-w-xs bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 text-sm"
                data-testid="narrative-effects-select"
                aria-label="Select narrative effects intensity level"
              >
                <option value="full">Full (All glitches and effects)</option>
                <option value="reduced">Reduced (Minimal glitches)</option>
                <option value="minimal">Minimal (Clean UI, thoughts only)</option>
              </select>
              <p className="text-xs text-zinc-400">
                Controls intensity of narrative UI effects like screen glitches and corruption
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400 font-mono">
          Query command reference (?) • Press Shift+Enter or Escape to close
        </div>
      </div>
    </div>,
    document.body
  );
};
