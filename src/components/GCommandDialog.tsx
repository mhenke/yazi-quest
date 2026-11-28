import React from 'react';
import { JUMP_TARGETS, type JumpTargetDefinition } from '../constants/keybindings';

export interface GCommandDialogProps {
  onClose: () => void;
  levelId?: number;
}

const TARGET_LIST = Object.values(JUMP_TARGETS);
const PRIMARY_TARGETS = TARGET_LIST.filter((entry) => entry.column === 'primary');
const SECONDARY_TARGETS = TARGET_LIST.filter((entry) => entry.column === 'secondary');

const rowColors = (locked: boolean) =>
  locked
    ? { key: 'text-zinc-400', label: 'text-zinc-400' }
    : { key: 'text-orange-500', label: 'text-zinc-300' };

const renderRow = (entry: JumpTargetDefinition, isLevelOne: boolean) => {
  const locked = isLevelOne && entry.key !== 'g';
  const colors = rowColors(locked);
  return (
    <div key={entry.key} className="flex items-center gap-3">
      <span className={`font-bold w-6 ${colors.key}`}>{entry.key}</span>
      <span className={colors.label}>{entry.displayName}</span>
      {locked && (
        <span className="ml-auto text-xs uppercase tracking-wider text-zinc-400 border border-zinc-700 px-1 rounded-xs">
          LVL 2+
        </span>
      )}
    </div>
  );
};

export const GCommandDialog: React.FC<GCommandDialogProps> = ({
  onClose: _onClose,
  levelId = 2,
}) => {
  const isLevelOne = levelId === 1;

  return (
    <div
      data-testid="g-command-dialog"
      className="fixed bottom-16 left-0 right-0 mx-auto w-fit max-w-[calc(100%-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-zinc-900/95 border border-zinc-700 shadow-2xl p-4 backdrop-blur-xs z-50 rounded-xs animate-terminal-rise sm:absolute"
      role="dialog"
      aria-modal="false"
      aria-label="Go to directory shortcuts"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs font-mono">
        {PRIMARY_TARGETS.map((entry) => renderRow(entry, isLevelOne))}
      </div>

      <div className="border-t border-zinc-800 my-2.5" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs font-mono">
        {SECONDARY_TARGETS.map((entry) => renderRow(entry, isLevelOne))}
      </div>

      <div className="text-center text-xs text-zinc-400 font-mono mt-3">
        {isLevelOne
          ? 'Press g for top · directory jumps unlock in Level 2 · Esc cancel'
          : "Press target key or 'Esc' to cancel"}
      </div>
    </div>
  );
};
