import { useEffect, useRef } from 'react';
import { GameState } from '../types';
import { Action } from './gameReducer';
import { LEVELS } from '../constants';
import { getNodeById } from '../utils/fsHelpers';

// Helper to trigger thought with auto-clear logic management
const useTriggerThought = (dispatch: React.Dispatch<Action>) => {
  const thoughtTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerThought = (message: string, _duration: number = 4000, author?: string) => {
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }
    dispatch({ type: 'SET_THOUGHT', payload: { text: message, author } });
    thoughtTimerRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (thoughtTimerRef.current) {
        clearTimeout(thoughtTimerRef.current);
      }
    };
  }, []);

  return triggerThought;
};

export const useNarrativeSystem = (gameState: GameState, dispatch: React.Dispatch<Action>) => {
  const triggerThought = useTriggerThought(dispatch);
  const shownInitialAlertForLevelRef = useRef<number | null>(null);
  const shownThoughtForLevelRef = useRef<number | null>(null);
  const shownNotificationForLevelRef = useRef<string | null>(null); // Track message + level
  const prevLevelIndex = useRef<number>(gameState.levelIndex);

  // --- Level Entry Narrative ---
  useEffect(() => {
    if (gameState.isGameOver) return;

    const levelIndex = gameState.levelIndex;
    const currentLevel = LEVELS[levelIndex];
    if (!currentLevel) return;

    // Reset refs if level changed
    if (prevLevelIndex.current !== levelIndex) {
      shownInitialAlertForLevelRef.current = null;
      shownThoughtForLevelRef.current = null;
      shownNotificationForLevelRef.current = null;
      prevLevelIndex.current = levelIndex;
    }

    // 1. Notifications
    let levelNotification: { message: string; author?: string; isThought?: boolean } | null = null;
    const completedTaskIds = gameState.completedTaskIds;

    // Specific Level Notifications
    if (currentLevel.id === 6) {
      levelNotification = {
        message:
          '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
      };
    } else if (currentLevel.id === 8) {
      levelNotification = {
        message: '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
        author: 'Mark Reyes',
      };
    } else if (currentLevel.id === 12) {
      levelNotification = {
        message:
          '[SECURITY UPDATE] Unauthorized daemon detected in /home/guest. Initiating forensic scan.',
        author: 'Yen Kin',
      };
    } else if (currentLevel.id === 14) {
      levelNotification = {
        message: '[BROADCAST] System-wide audit in progress. Purging all temporary partitions.',
        author: 'Root',
      };
    } else if (levelIndex >= 11 - 1 && levelIndex < 14) {
      if (currentLevel.id >= 11 && currentLevel.id <= 13) {
        levelNotification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
      }
    }

    // Transition Thoughts
    if (currentLevel.id === 2 && completedTaskIds[1]?.length > 0) {
      levelNotification = { message: 'Must Purge. One less eye watching me.', isThought: true };
    } else if (currentLevel.id === 3 && completedTaskIds[2]?.length > 0) {
      levelNotification = {
        message: 'Breadcrumbs... he was here. I am not the first.',
        isThought: true,
      };
    } else if (currentLevel.id === 9 && completedTaskIds[8]?.length > 0) {
      levelNotification = {
        message: 'The corruption felt... familiar. Like a half-remembered dream.',
        isThought: true,
      };
    } else if (currentLevel.id === 10 && completedTaskIds[9]?.length > 0) {
      levelNotification = {
        message:
          "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.",
        isThought: true,
      };
    } else if (currentLevel.id === 15 && completedTaskIds[14]?.length > 0) {
      levelNotification = {
        message: 'The guest partition is gone. There is only the gauntlet now.',
        isThought: true,
      };
    } else if (currentLevel.id === 5 && completedTaskIds[4]?.length > 0) {
      levelNotification = {
        message:
          '[AUTOMATED PROCESS] Ghost Protocol: Uplink configs auto-populated by legacy cron job (AI-7733 footprint detected)',
        author: 'sys.daemon',
      };
    }

    // Dispatch if we have something
    if (levelNotification) {
      if (levelNotification.isThought) {
        // Only trigger if we haven't shown a thought for this level yet
        if (shownThoughtForLevelRef.current !== currentLevel.id) {
          triggerThought(levelNotification.message, 4000, levelNotification.author);
          shownThoughtForLevelRef.current = currentLevel.id;
        }
      } else {
        // Only trigger if this specific level-based notification hasn't been shown yet
        const notificationKey = `${currentLevel.id}:${levelNotification.message}`;
        if (shownNotificationForLevelRef.current !== notificationKey) {
          dispatch({
            type: 'SET_NOTIFICATION',
            message: levelNotification.message,
            author: levelNotification.author,
            isThought: false,
          });
          shownNotificationForLevelRef.current = notificationKey;
        }
      }
    }

    // 2. Initial Level Thoughts
    if (
      currentLevel.thought &&
      shownThoughtForLevelRef.current !== currentLevel.id &&
      !gameState.showEpisodeIntro &&
      !gameState.isGameOver
    ) {
      shownThoughtForLevelRef.current = currentLevel.id;
      triggerThought(currentLevel.thought);
    }

    // 3. Initial Alerts (Level 5 Quarantine)
    if (
      currentLevel.id === 5 &&
      shownInitialAlertForLevelRef.current !== 5 &&
      !gameState.showEpisodeIntro &&
      !gameState.isGameOver
    ) {
      shownInitialAlertForLevelRef.current = 5;
      dispatch({
        type: 'SET_ALERT_MESSAGE',
        message:
          '🚨 QUARANTINE ALERT - Active UPLINK configurations detected. Upgraded and activated Watchdog v2.0 has identified AI-7733 signatures. Evacuate assets immediately.',
      });
      dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: true });
    }
  }, [
    gameState.levelIndex,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    gameState.cycleCount,
    gameState.completedTaskIds,
    gameState.notification?.message,
    dispatch,
    triggerThought,
  ]);

  // --- Task Completion Narrative ---
  const prevCompletedTasksRef = useRef<Record<number, string[]>>(gameState.completedTaskIds);
  const shownLevelCompletionThoughtRef = useRef<Set<number>>(new Set());

  // Clear shownLevelCompletionThoughtRef when cycle changes (New Game+ support)
  useEffect(() => {
    shownLevelCompletionThoughtRef.current.clear();
  }, [gameState.cycleCount]);

  useEffect(() => {
    const currentLevel = LEVELS[gameState.levelIndex];
    if (!currentLevel || gameState.isGameOver) return;

    const prevTasks = prevCompletedTasksRef.current[currentLevel.id] || [];
    const currTasks = gameState.completedTaskIds[currentLevel.id] || [];

    // Find newly completed tasks
    const newTasks = currTasks.filter((t) => !prevTasks.includes(t));

    if (newTasks.length > 0) {
      // Level 5
      if (currentLevel.id === 5 && newTasks.includes('establish-stronghold')) {
        triggerThought('Deeper into the shadow. They cannot track me in the static.');
      }

      // --- Level Completion Thought Triggers ---
      // Check if all tasks are now complete for this level
      const allTasksComplete = currentLevel.tasks.every(
        (t) => currTasks.includes(t.id) || (t.hidden && t.hidden(gameState, currentLevel))
      );

      if (allTasksComplete && !shownLevelCompletionThoughtRef.current.has(currentLevel.id)) {
        shownLevelCompletionThoughtRef.current.add(currentLevel.id);

        if (currentLevel.thought) {
          // Use level-specific completion thought if defined
          triggerThought(currentLevel.thought);
        } else {
          // Generic completion thoughts
          triggerThought(`Level ${currentLevel.id} complete. Protocol executed successfully.`);
          const optimalKeystrokes = currentLevel.maxKeystrokes || 50;
          if (gameState.keystrokes < optimalKeystrokes * 1.2) {
            triggerThought('Efficient navigation. Minimal footprint detected.');
          }
        }
      }
    }

    prevCompletedTasksRef.current = gameState.completedTaskIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState.completedTaskIds,
    gameState.levelIndex,
    gameState.isGameOver,
    gameState.keystrokes,
    dispatch,
    triggerThought,
  ]);

  // --- Threat / Honeypot Detection (State Observation) ---
  useEffect(() => {
    if (gameState.isGameOver) return;
    const currentLevel = LEVELS[gameState.levelIndex];
    if (!currentLevel) return;

    // Level 6: Clipboard Honeypot
    if (currentLevel.id === 6) {
      const hasClipboardHoneypot = gameState.clipboard?.nodes?.some(
        (n) => n.isHoneypot || n.content?.includes('HONEYPOT')
      );

      if (hasClipboardHoneypot && !gameState.showThreatAlert) {
        dispatch({
          type: 'SET_ALERT_MESSAGE',
          message: 'PROTOCOL VIOLATION: Active process file locked. You cannot move system locks.',
        });
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: true });
      }
    }

    // Level 12: Anomaly Alerts (Scenario specific)
    if (currentLevel.id === 12) {
      const workspace = getNodeById(gameState.fs, 'workspace');
      const incoming = getNodeById(gameState.fs, 'incoming');
      const config = getNodeById(gameState.fs, '.config');

      let alertMsg = '';
      if (workspace && workspace.children?.some((n) => n.name === 'alert_traffic.log')) {
        alertMsg =
          'WARNING: High-bandwidth anomaly detected. Traffic log quarantined in workspace.';
      } else if (incoming && incoming.children?.some((n) => n.id === 'scen-b2')) {
        alertMsg =
          'WARNING: Unauthorized packet trace intercepted. Source file isolated in ~/incoming.';
      } else if (
        workspace &&
        workspace.children?.some((n) => n.id === 'scen-b3-1' || n.id === 'scen-b3-2')
      ) {
        alertMsg =
          'WARNING: Heuristic swarm activity detected. Temporary scan files generated in workspace.';
      } else if (config && config.children?.some((n) => n.id === 'scen-a2')) {
        alertMsg = 'WARNING: Process instability detected. Core dump written to .config.';
      } else if (workspace && workspace.children?.some((n) => n.id === 'scen-a3')) {
        alertMsg = 'WARNING: Dependency failure. Error log generated.';
      }

      if (alertMsg && gameState.alertMessage !== alertMsg) {
        dispatch({ type: 'SET_ALERT_MESSAGE', message: alertMsg });
        dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'threat', visible: true });
      }
    }
  }, [
    gameState.clipboard,
    gameState.selectedIds,
    gameState.fs,
    gameState.levelIndex,
    gameState.isGameOver,
    gameState.showThreatAlert,
    gameState.level11Flags,
    gameState.alertMessage,
    gameState.currentPath,
    dispatch,
  ]);
};
