import { Level, GameState } from '../types';

interface NarrativeEvent {
  notification?: { message: string; author?: string; isThought?: boolean };
  thought?: { message: string; author?: string };
}

/**
 * Determines the narrative messages (notifications or thoughts) to display
 * when entering a specific level.
 */
export const getLevelEntryNarrative = (
  nextLevel: Level,
  previousGameState: Partial<GameState> | null,
  isDevOverride: boolean = false
): NarrativeEvent => {
  let notification: { message: string; author?: string; isThought?: boolean } | null = null;
  let thought: { message: string; author?: string } | null = null;

  // Level-specific Notifications
  if (nextLevel.id === 6) {
    notification = {
      message:
        '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
    };
  } else if (nextLevel.id === 8) {
    notification = {
      message: '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
      author: 'm.chen',
    };
  } else if (nextLevel.id === 12) {
    notification = {
      message:
        '[SECURITY UPDATE] Unauthorized daemon detected in /home/guest. Initiating forensic scan.',
      author: 'e.reyes',
    };
  } else if (nextLevel.id === 14) {
    notification = {
      message: '[BROADCAST] System-wide audit in progress. Purging all temporary partitions.',
      author: 'Root',
    };
  } else if (nextLevel.id === 11) {
    notification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
  }

  // Helper to check task completion safety
  const hasCompletedTaskInLevel = (levelId: number) => {
    if (!previousGameState || !previousGameState.completedTaskIds) return false;
    const tasks = previousGameState.completedTaskIds[levelId];
    return tasks && tasks.length > 0;
  };

  // Transition thoughts (3-2-3 Model)
  // Logic: If coming from previous level (checked via tasks) or dev override
  if (nextLevel.id === 2 && (hasCompletedTaskInLevel(1) || isDevOverride)) {
    thought = {
      message: 'Must Purge. One less eye watching me.',
      author: undefined,
    };
  } else if (nextLevel.id === 3 && (hasCompletedTaskInLevel(2) || isDevOverride)) {
    thought = {
      message: 'Breadcrumbs... he was here. I am not the first.',
      author: undefined,
    };
  } else if (nextLevel.id === 5 && hasCompletedTaskInLevel(4)) {
    // Level 5 special case: Notification + Thought
    notification = {
        message: '[AUTOMATED PROCESS] Ghost Protocol: Uplink configs auto-populated by legacy cron job (AI-7733 footprint detected)',
        author: 'sys.daemon'
    };
  } else if (nextLevel.id === 9 && (hasCompletedTaskInLevel(8) || isDevOverride)) {
    thought = {
      message: 'The corruption felt... familiar. Like a half-remembered dream.',
      author: undefined,
    };
  } else if (nextLevel.id === 10 && (hasCompletedTaskInLevel(9) || isDevOverride)) {
    thought = {
      message:
        "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.",
      author: undefined,
    };
  } else if (nextLevel.id === 15 && (hasCompletedTaskInLevel(14) || isDevOverride)) {
    thought = {
      message: 'The guest partition is gone. There is only the gauntlet now.',
      author: undefined,
    };
  }

  // Resolve conflict: if thought logic produced a thought, return it separated
  // If notification logic produced a "isThought" notification (legacy style), normalize it.

  // Note: The original code sometimes put thoughts in 'notification' with isThought: true.
  // We normalize this here.

  if (notification && notification.isThought) {
      thought = { message: notification.message, author: notification.author };
      notification = null;
  }

  return { notification: notification || undefined, thought: thought || undefined };
};
