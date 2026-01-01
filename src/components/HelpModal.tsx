import React, { useEffect, useRef, useState } from "react";
import { KEYBINDINGS, META_KEYBINDINGS } from "../constants";

interface HelpModalProps {
  onClose: () => void;
}

const LINE_HEIGHT = 20; // Approximate line height in pixels

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default to avoid side effects on the main app
      e.preventDefault();

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "j" || e.key === "ArrowDown") {
        setScrollPosition(prev => prev + 1);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        setScrollPosition(prev => Math.max(0, prev - 1));
      } else if (e.key === "J" && e.shiftKey) {
        setScrollPosition(prev => prev + 5);
      } else if (e.key === "K" && e.shiftKey) {
        setScrollPosition(prev => Math.max(0, prev - 5));
      } else if (e.key === "h") {
        // Allow 'h' to move up a small amount in the modal
        setScrollPosition(prev => Math.max(0, prev - 1));
      } else if (e.key === "l") {
        // Allow 'l' to move down a small amount in the modal
        setScrollPosition(prev => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Focus the scrollable div when the modal opens
    if (scrollRef.current) {
      scrollRef.current.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosition * LINE_HEIGHT;
    }
  }, [scrollPosition]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onKeyDown={e => e.stopPropagation()} // Prevent events from bubbling up
      tabIndex={-1} // Make the div focusable
      ref={scrollRef} // Assign ref to the outermost div for focus
    >
      <div className="w-full max-w-2xl md:max-w-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 relative max-h-[80vh] overflow-auto">
        <div className="mb-6 border-b border-zinc-800 pb-2">
          <h2 className="text-xl font-bold text-orange-500 tracking-wider">HELP / KEYBINDINGS</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <h3 className="text-sm font-bold text-orange-400 mb-2">Core Yazi Commands</h3>
            <div className="space-y-2">
              {KEYBINDINGS.map((binding, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-1 rounded">
                  <span className="text-zinc-400">
                    {binding.narrativeDescription || binding.description}
                  </span>
                  <div className="flex gap-1">
                    {binding.keys.map(k => (
                      <span
                        key={k}
                        className="min-w-[24px] text-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300 font-mono text-xs font-bold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-yellow-400 mb-2">Game Meta Commands</h3>
            <div className="space-y-2">
              {META_KEYBINDINGS.map((binding, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-1 rounded">
                  <span className="text-zinc-400">
                    {binding.narrativeDescription || binding.description}
                  </span>
                  <div className="flex gap-1">
                    {binding.keys.map(k => (
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
        <div className="mt-8 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-600 font-mono">
          Query command reference (?) • Press Esc to close
        </div>
      </div>
    </div>
  );
};
