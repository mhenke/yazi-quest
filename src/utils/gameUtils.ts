import { GameState, Level } from '../types';
import { KEYBINDINGS } from '../constants/keybindings';
import { getVisibleItems } from './viewHelpers';
import { isProtected } from './fsHelpers';

/**
 * Returns a random element from an array.
 */
export const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Finds the narrative description for a given key.
 */
export const getNarrativeAction = (key: string): string | null => {
  const binding = KEYBINDINGS.find((b) => b.keys.includes(key));
  if (binding && binding.narrativeDescription) {
    if (Array.isArray(binding.narrativeDescription)) {
      return getRandomElement(binding.narrativeDescription);
    }
    return binding.narrativeDescription as string;
  }
  return null;
};

/**
 * Checks if a honeypot has been triggered.
 */
export const checkHoneypotTriggered = (
  gameState: GameState,
  pendingDeleteIds: string[],
  currentLevel: Level
): { triggered: boolean; reason?: 'honeypot'; message?: string } => {
  const items = getVisibleItems(gameState);

  // Level 14 honeypot check: if deleting .purge_lock before decoys are created
  if (currentLevel.id === 14) {
    const decoysCreated = gameState.completedTaskIds[14]?.includes('create-decoys');
    const deletingHoneypot = pendingDeleteIds.some((id) => {
      const node = items.find((n) => n.id === id);
      return node?.name === '.purge_lock' || node?.id === 'purge-lock-honeypot';
    });
    if (deletingHoneypot && !decoysCreated) {
      return {
        triggered: true,
        message:
          '🚨 HONEYPOT TRIGGERED! Security tripwire detected. Create decoy directories FIRST to mask your deletion pattern.',
      };
    }
  }

  // Level 9 Honeypot: system_monitor.pid
  if (currentLevel.id === 9) {
    const deletingHoneypot = pendingDeleteIds.some((id) => {
      const node = items.find((n) => n.id === id);
      return node?.name === 'system_monitor.pid';
    });
    if (deletingHoneypot) {
      const secondaryMsg = gameState.usedCtrlR
        ? 'PATTERN PARTIALLY RECOGNIZED. Forensics detected deletion of SYSTEM MONITOR partition.'
        : null;
      return {
        triggered: true,
        reason: 'honeypot',
        message: secondaryMsg || undefined,
      };
    }
  }

  return { triggered: false };
};

/**
 * Checks if a critical system folder is being deleted.
 */
export const checkCriticalFileDeletion = (
  gameState: GameState,
  pendingDeleteIds: string[]
): boolean => {
  const items = getVisibleItems(gameState);
  const CRITICAL_FOLDERS = [
    'bin',
    'boot',
    'dev',
    'etc',
    'home',
    'lib',
    'lib64',
    'proc',
    'root',
    'run',
    'sbin',
    'sys',
    'usr',
    'var',
  ];

  for (const id of pendingDeleteIds) {
    const node = items.find((n) => n.id === id);
    const isRoot = gameState.currentPath.length === 1 && gameState.currentPath[0] === 'root';
    if (node && isRoot && CRITICAL_FOLDERS.includes(node.name)) {
      return true;
    }
  }
  return false;
};

/**
 * Validates if the pending deletions are allowed by protection policies.
 */
export const validateDeletions = (
  gameState: GameState,
  pendingDeleteIds: string[],
  currentLevel: Level
): { ok: true } | { ok: false; error: string } => {
  const items = getVisibleItems(gameState);
  for (const id of pendingDeleteIds) {
    const node = items.find((n) => n.id === id);
    if (node) {
      const targetDirPath =
        node.path && node.path.length > 0 ? node.path.slice(0, -1) : gameState.currentPath;
      const protection = isProtected(
        gameState.fs,
        targetDirPath,
        node,
        currentLevel,
        'delete',
        gameState.completedTaskIds
      );
      if (protection) {
        return { ok: false, error: protection };
      }
    }
  }
  return { ok: true };
};
