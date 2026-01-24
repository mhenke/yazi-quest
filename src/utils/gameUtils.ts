import { GameState, Level, FileNode } from '../types';
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

  // 1. Level-Specific Conditional Logic
  // Level 14 honeypot check: if deleting .purge_lock before decoys are created
  if (currentLevel.id === 14) {
    const decoysCreated = gameState.completedTaskIds[14]?.includes('create-decoys');
    const deletingHoneypot = pendingDeleteIds.some((id) => {
      const node = items.find((n) => n.id === id);
      // Fallback to name/id check for safety during transition, but prefer isHoneypot
      return node?.isHoneypot || node?.name === '.purge_lock' || node?.id === 'purge-lock-honeypot';
    });
    if (deletingHoneypot && !decoysCreated) {
      return {
        triggered: true,
        message:
          '🚨 HONEYPOT TRIGGERED! Security tripwire detected. Create decoy directories FIRST to mask your deletion pattern.',
      };
    }
    // If decoys are created, we allow deleting the honeypot (it's no longer a trap for the player)
    if (deletingHoneypot && decoysCreated) {
      return { triggered: false };
    }
  }

  // 2. Persistent Honeypots (isHoneypot flag)
  const triggeredHoneypot = pendingDeleteIds.find((id) => {
    const node = items.find((n) => n.id === id);
    return node?.isHoneypot;
  });

  if (triggeredHoneypot) {
    const node = items.find((n) => n.id === triggeredHoneypot);
    // Level 9 Narrative Flavor
    if (currentLevel.id === 9 && node?.name === 'system_monitor.pid') {
      const secondaryMsg = gameState.usedCtrlR
        ? 'PATTERN PARTIALLY RECOGNIZED. Forensics detected deletion of SYSTEM MONITOR partition.'
        : null;
      return {
        triggered: true,
        reason: 'honeypot',
        message: secondaryMsg || undefined,
      };
    }

    return {
      triggered: true,
      reason: 'honeypot',
      message: `ANOMALY DETECTED: Deletion of ${node?.name} triggered a forensic alert.`,
    };
  }

  // Fallback for content-based traps (mostly for Level 11 check logic or manual content markers)
  const contentTrap = pendingDeleteIds.find((id) => {
    const node = items.find((n) => n.id === id);
    return node?.content?.includes('HONEYPOT') || node?.content?.includes('audit-trap');
  });

  if (contentTrap) {
    const node = items.find((n) => n.id === contentTrap);
    return {
      triggered: true,
      reason: 'honeypot',
      message: `ANOMALY DETECTED: Deletion of signature-trap ${node?.name} detected.`,
    };
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

/**
 * Checks if any of the nodes being yanked/cut are honeypots.
 */
export const checkGrabbingHoneypot = (nodes: FileNode[]): boolean => {
  return nodes.some(
    (n) => n.isHoneypot || n.content?.includes('HONEYPOT') || n.name === 'access_token.key'
  );
};

/**
 * Checks if the clipboard contains a honeypot before pasting.
 */
export const checkPastingHoneypot = (
  nodes: FileNode[]
): { triggered: boolean; type: 'warning' | 'fatal'; message?: string } => {
  // L8 style fatal traps
  const hasFatalTrap = nodes.some((n) => n.name.endsWith('.trap') || n.content?.includes('TRAP'));

  if (hasFatalTrap) {
    return {
      triggered: true,
      type: 'fatal',
      message: '🚨 CRITICAL SYSTEM VIOLATION: Signature-trap deployment detected.',
    };
  }

  // Standard honeypots
  const hasHoneypot = nodes.some(
    (n) => n.isHoneypot || n.content?.includes('HONEYPOT') || n.name === 'access_token.key'
  );

  if (hasHoneypot) {
    return {
      triggered: true,
      type: 'warning',
      message: '⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard before proceeding!',
    };
  }

  return { triggered: false, type: 'warning' };
};
