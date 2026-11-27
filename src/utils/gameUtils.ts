import { GameState, Level, FileNode } from '../types';
import { findPathById, getNodeById, isProtected } from './fsHelpers';

// Level definitions use directory names; player-created directories have generated IDs.
export const getLevelStartPath = (fs: FileNode, level: Level): string[] => {
  const names = level.initialPath || ['root', 'home', 'guest'];
  const path = [fs.id];
  let node = fs;
  for (let i = 1; i < names.length; i++) {
    const child = node.children?.find((entry) => entry.name === names[i]);
    if (!child) throw new Error(`Level ${level.id} start directory missing: ${names[i]}`);
    node = child;
    path.push(node.id);
  }
  return path;
};

// Define the pattern used in level 9 to identify keeper files
const LEVEL_9_KEEPER_PATTERN = /\.(key|pid|sock)$/;

// Live (non-decoy) honeypot: flagged in metadata or marked in its content.
const isLiveHoneypot = (node: FileNode): boolean =>
  (node.isHoneypot && !node.isDecoy) || !!node.content?.includes('HONEYPOT');

// Fallback/paste check: the sticky access_token.key trap counts as a honeypot too.
const isLiveHoneypotOrToken = (node: FileNode): boolean =>
  isLiveHoneypot(node) || node.name === 'access_token.key';

/**
 * Checks if a honeypot has been triggered.
 */
export const checkHoneypotTriggered = (
  gameState: GameState,
  pendingDeleteIds: string[],
  currentLevel: Level
): { triggered: boolean; reason?: 'honeypot'; message?: string } => {
  // 1. Level-Specific Conditional Logic
  // Level 14 (STERILIZATION): Allow deleting ALL files including honeypots.
  // The narrative requires purging everything to "sterilize" the partition.
  if (currentLevel.id === 14) {
    return { triggered: false };
  }

  const isLevel9 = currentLevel.id === 9;

  const findMatchingPendingNode = (
    predicate: (node: FileNode) => boolean
  ): FileNode | undefined => {
    for (const id of pendingDeleteIds) {
      const node = getNodeById(gameState.fs, id);
      if (node && predicate(node)) return node;
    }
    return undefined;
  };

  // 2. Persistent Honeypots (isHoneypot flag)
  // On Level 9, only keeper files (.key, .pid, .sock) are live traps; other flagged files are
  // decoys and must not short-circuit the check or mask later traps in the same batch.
  const triggeredHoneypot = findMatchingPendingNode(
    (node) =>
      Boolean(node.isHoneypot && !node.isDecoy) &&
      (!isLevel9 || LEVEL_9_KEEPER_PATTERN.test(node.name))
  );

  if (triggeredHoneypot) {
    if (isLevel9) {
      return {
        triggered: true,
        reason: 'honeypot',
        message: `TRAP ACTIVATED: Attempting to delete critical asset '${triggeredHoneypot.name}'. This will compromise your operation.`,
      };
    }

    return {
      triggered: true,
      reason: 'honeypot',
      message: `ANOMALY DETECTED: Deletion of ${triggeredHoneypot.name} triggered a forensic alert.`,
    };
  }

  // Fallback for content-based traps (mostly for Level 11 check logic or manual content markers)
  const contentTrap = findMatchingPendingNode(
    (node) =>
      Boolean(node.content?.includes('HONEYPOT') || node.content?.includes('audit-trap')) &&
      (!isLevel9 || LEVEL_9_KEEPER_PATTERN.test(node.name))
  );

  if (contentTrap) {
    return {
      triggered: true,
      reason: 'honeypot',
      message: `ANOMALY DETECTED: Deletion of signature-trap ${contentTrap.name} detected.`,
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
    const node = getNodeById(gameState.fs, id);
    const isRoot = findPathById(gameState.fs, id)?.length === 2;
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
  for (const id of pendingDeleteIds) {
    const node = getNodeById(gameState.fs, id);
    if (node) {
      const targetDirPath = findPathById(gameState.fs, id)?.slice(0, -1);
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
export const checkGrabbingHoneypot = (
  nodes: FileNode[],
  levelIndex: number
): { triggered: boolean; severity: 'notification' | 'modal' | 'gameover'; message?: string } => {
  const levelId = levelIndex + 1;

  // Level 6: Clipboard Honeypot (active_log_sync.lock)
  if (levelId === 6) {
    const hasHoneypot = nodes.some(isLiveHoneypot);
    if (hasHoneypot) {
      return {
        triggered: true,
        severity: 'modal',
        message:
          'PROTOCOL VIOLATION: Active process file locked. Clear clipboard (Y) before moving on.',
      };
    }
  }

  // Level 7: Sticky Trap
  if (levelId === 7) {
    const hasToken = nodes.some((n) => n.name === 'access_token.key');
    if (hasToken) {
      return {
        triggered: true,
        severity: 'modal',
        message:
          'HONEYPOT DETECTED. access_token.key is a security trap. Clear clipboard (Y) before pasting.',
      };
    }
  }

  // Level 11 & 12: Honeypots
  if (levelId === 11 || levelId === 12) {
    const hasHoneypot = nodes.some(isLiveHoneypot);
    if (hasHoneypot) {
      return {
        triggered: true,
        severity: 'modal',
        message: '🚨 HONEYPOT TRIGGERED! Security trace initiated. This will have consequences.',
      };
    }
  }

  // General Honeypot
  const hasHoneypot = nodes.some(isLiveHoneypotOrToken);

  if (hasHoneypot) {
    return {
      triggered: true,
      severity: 'notification',
      message:
        '🚨 HONEYPOT DETECTED! You grabbed a security trap file. Clear clipboard (Y) immediately!',
    };
  }

  return { triggered: false, severity: 'notification' };
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
  const hasHoneypot = nodes.some(isLiveHoneypotOrToken);

  if (hasHoneypot) {
    return {
      triggered: true,
      type: 'warning',
      message: '⚠️ SYSTEM TRAP ACTIVE: Press Y to clear clipboard before proceeding!',
    };
  }

  return { triggered: false, type: 'warning' };
};

/**
 * Checks if all tasks for the current level are complete,
 * taking into account hidden/skipped tasks.
 */
export const checkAllTasksComplete = (gameState: GameState, level: Level): boolean => {
  return level.tasks.every((t) => {
    // Inject completion status from gameState for the projection
    const isCompleted = (gameState.completedTaskIds[level.id] || []).includes(t.id);
    const isHidden = t.hidden && t.hidden(gameState, level);
    return isCompleted || isHidden;
  });
};
