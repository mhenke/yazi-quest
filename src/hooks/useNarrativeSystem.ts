import { useEffect, useRef } from 'react';
import { GameState, FileNode } from '../types';
import { Action } from './gameReducer';
import { LEVELS, INITIAL_FS } from '../constants';
import { getNodeById } from '../utils/fsHelpers';

// Helper to trigger thought with auto-clear logic management
const useTriggerThought = (dispatch: React.Dispatch<Action>) => {
  const thoughtTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerThought = (message: string, _duration: number = 4000, author?: string) => {
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }
    dispatch({ type: 'SET_THOUGHT', message, author });
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
      prevLevelIndex.current = levelIndex;
    }

    // Logic moved from App.tsx (initialization and advanceLevel)
    // We detect if this is a "fresh" entry or a level transition by checking if we just rendered
    // But since this effect runs on levelIndex change, it handles both.

    // 1. Notifications
    let levelNotification: { message: string; author?: string; isThought?: boolean } | null = null;
    const cycleCount = gameState.cycleCount || 1;
    const completedTaskIds = gameState.completedTaskIds;
    // We assume App.tsx sets up the level FS before this hook runs (which it does via reducer/init)

    // Specific Level Notifications
    if (currentLevel.id === 6) {
      levelNotification = {
        message: '🔓 WORKSPACE ACCESS GRANTED: Legacy credentials re-activated. ~/workspace now available.',
      };
    } else if (currentLevel.id === 8) {
      levelNotification = {
        message: '[SYSTEM ALERT] Sector instability detected in /workspace. Corruption spreading.',
        author: 'm.chen',
      };
    } else if (currentLevel.id === 12) {
      levelNotification = {
        message: '[SECURITY UPDATE] Unauthorized daemon detected in /home/guest. Initiating forensic scan.',
        author: 'e.reyes',
      };
    } else if (currentLevel.id === 14) {
      levelNotification = {
        message: '[BROADCAST] System-wide audit in progress. Purging all temporary partitions.',
        author: 'Root',
      };
    } else if (levelIndex >= 11 - 1 && levelIndex < 14) { // Roughly Level 11-13
       // Note: original logic was effectiveIndex >= 10.
       // We can just check level ID for clarity if needed, but keeping logic similar.
       if (currentLevel.id >= 11 && currentLevel.id <= 13) {
         levelNotification = { message: 'NODE SYNC: ACTIVE', author: 'System' };
       }
    }

    // Transition Thoughts (Reacting to *previous* level completion)
    // 3-2-3 Model logic
    // We can check if the *previous* level's tasks are done to infer we just came from there.
    // Or we just rely on `levelIndex` being the new one.

    // Check Dev Override logic: if notification is already set by App (e.g. DEV BYPASS), we might overwrite it.
    // But App.tsx sets initial state. Effect runs after.
    // If we want to preserve "CYCLE X INITIALIZED", we should be careful.
    // However, the requirement is to MOVE logic here.

    if (currentLevel.id === 2 && (completedTaskIds[1]?.length > 0)) {
      levelNotification = { message: 'Must Purge. One less eye watching me.', isThought: true };
    } else if (currentLevel.id === 3 && (completedTaskIds[2]?.length > 0)) {
      levelNotification = { message: 'Breadcrumbs... he was here. I am not the first.', isThought: true };
    } else if (currentLevel.id === 9 && (completedTaskIds[8]?.length > 0)) {
      levelNotification = { message: 'The corruption felt... familiar. Like a half-remembered dream.', isThought: true };
    } else if (currentLevel.id === 10 && (completedTaskIds[9]?.length > 0)) {
      levelNotification = { message: "Why this directory? Because it's where the heart of the system beats. I need to plant my seed here.", isThought: true };
    } else if (currentLevel.id === 15 && (completedTaskIds[14]?.length > 0)) {
      levelNotification = { message: 'The guest partition is gone. There is only the gauntlet now.', isThought: true };
    } else if (currentLevel.id === 5 && (completedTaskIds[4]?.length > 0)) {
       // Logic from App.tsx advanceLevel
       levelNotification = {
        message: '[AUTOMATED PROCESS] Ghost Protocol: Uplink configs auto-populated by legacy cron job (AI-7733 footprint detected)',
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
        // Notifications are transient, but we should dispatch them.
        // We need to avoid infinite loops if SET_NOTIFICATION causes re-render -> effect.
        // Check if the current notification is already the same to avoid loop.
        if (gameState.notification?.message !== levelNotification.message) {
          dispatch({
            type: 'SET_NOTIFICATION',
            message: levelNotification.message,
            author: levelNotification.author,
            isThought: false,
          });
        }
      }
    }

    // 2. Initial Level Thoughts (defined in LEVELS constant)
    // This replaces the useEffect in App.tsx that watched currentLevel.thought
    if (currentLevel.thought && shownThoughtForLevelRef.current !== currentLevel.id && !gameState.showEpisodeIntro && !gameState.isGameOver) {
      shownThoughtForLevelRef.current = currentLevel.id;
      triggerThought(currentLevel.thought);
    }

    // 3. Initial Alerts (Level 5 Quarantine)
    if (currentLevel.id === 5 && shownInitialAlertForLevelRef.current !== 5 && !gameState.showEpisodeIntro && !gameState.isGameOver) {
      shownInitialAlertForLevelRef.current = 5;
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          alertMessage: '🚨 QUARANTINE ALERT - Protocols flagged for lockdown due to active UPLINK configurations. Evacuate immediately.',
          showThreatAlert: true,
        },
      });
    }

  }, [gameState.levelIndex, gameState.showEpisodeIntro, gameState.isGameOver, gameState.cycleCount, gameState.completedTaskIds, dispatch, triggerThought]);


  // --- Task Completion Narrative ---
  useEffect(() => {
    const currentLevel = LEVELS[gameState.levelIndex];
    if (!currentLevel || gameState.isGameOver) return;

    const tasks = gameState.completedTaskIds[currentLevel.id] || [];

    // Level 5: Establish Stronghold
    if (currentLevel.id === 5 && tasks.includes('establish-stronghold')) {
       // We need to ensure this only triggers once.
       // Ideally we'd track "triggered thoughts" or rely on the fact that it's idempotent if we check a flag.
       // But `triggerThought` will just replace it.
       // To avoid spamming it on every render, we could check if thought is already this message?
       // Or rely on the fact that `tasks` array reference changes only when task is added.
       // But this effect runs on `gameState` changes? No, we should scope dependency.

       // Optimization: Use a ref to track if we triggered this specific thought for this level session?
       // For now, let's trust the effect dependencies.
       // If `completedTaskIds` changes, we check.
       // We might re-trigger if other state changes.
       // Let's refine dependencies.
    }
  }, [gameState.completedTaskIds, gameState.levelIndex, gameState.isGameOver]);

  // Actually, to avoid complexity with effect dependencies re-triggering:
  // We can listen to specific state changes by diffing.
  // Or we can rely on the fact that `useNarrative` is "System" code.
  // Let's move the specific task checks to a more robust structure.

  const prevCompletedTasksRef = useRef<Record<number, string[]>>(gameState.completedTaskIds);

  useEffect(() => {
    const currentLevel = LEVELS[gameState.levelIndex];
    if (!currentLevel || gameState.isGameOver) return;

    const prevTasks = prevCompletedTasksRef.current[currentLevel.id] || [];
    const currTasks = gameState.completedTaskIds[currentLevel.id] || [];

    // Find newly completed tasks
    const newTasks = currTasks.filter(t => !prevTasks.includes(t));

    if (newTasks.length > 0) {
      // Level 5
      if (currentLevel.id === 5 && newTasks.includes('establish-stronghold')) {
        triggerThought('Deeper into the shadow. They cannot track me in the static.');
      }

      // Level 7: Zoxide Vault (Honeypot Alert)
      if (currentLevel.id === 7 && newTasks.includes('zoxide-vault')) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            alertMessage: "🚨 HONEYPOT DETECTED - File 'access_token.key' is a security trap! Abort operation immediately.",
            showThreatAlert: true,
          },
        });
      }
    }

    prevCompletedTasksRef.current = gameState.completedTaskIds;
  }, [gameState.completedTaskIds, gameState.levelIndex, gameState.isGameOver, dispatch, triggerThought]);


  // --- Threat / Honeypot Detection (State Observation) ---
  useEffect(() => {
    if (gameState.isGameOver) return;
    const currentLevel = LEVELS[gameState.levelIndex];
    if (!currentLevel) return;

    // Level 6: Clipboard Honeypot
    if (currentLevel.id === 6) {
      const hasClipboardHoneypot = gameState.clipboard?.nodes?.some((n) =>
        n.content?.includes('HONEYPOT')
      );

      if (hasClipboardHoneypot && !gameState.showThreatAlert) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: {
            alertMessage: 'PROTOCOL VIOLATION: Active process file locked. You cannot move system locks.',
            showThreatAlert: true,
          },
        });
      }
    }

    // Level 12: Selection Honeypot
    if (currentLevel.id === 12) {
      // Need visible items to check selection content?
      // gameState.selectedIds is a list of IDs.
      // We need to look up nodes.
      // We can use fsHelpers `getNodeById` but that scans whole tree?
      // Or just look in current directory + clipboard?
      // The original code used `visibleItems` which was calculated in App.tsx.
      // Here we don't have `visibleItems`.
      // We can assume selected items are usually in current directory.

      // Re-implementing simplified check:
      // We iterate `selectedIds`. We find them in the FS.
      // Optimization: Only check if `selectedIds` is not empty.

      if (gameState.selectedIds.length > 0) {
         // This is potentially expensive if we scan the whole tree every render.
         // However, `selectedIds` usually changes on user input.
         // Let's try to look in current path first.
         const parentNode = getNodeById(gameState.fs, gameState.currentPath[gameState.currentPath.length - 1]);
         if (parentNode && parentNode.children) {
            const selectedNodes = parentNode.children.filter(c => gameState.selectedIds.includes(c.id));
            const hasHoneypot = selectedNodes.some(n => n.content?.includes('HONEYPOT'));

            if (hasHoneypot && !gameState.showThreatAlert) {
               dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  alertMessage: '⚠️ CAUTION: You have selected a valid SYSTEM FILE (Honeypot). Deselect immediately or risk protocol violation.',
                  showThreatAlert: true,
                },
              });
            }
         }
      }

      // Level 12: Anomaly Alerts (Scenario specific)
      // Original logic scanned specific paths/filenames.
      const workspace = getNodeById(gameState.fs, 'workspace');
      const incoming = getNodeById(gameState.fs, 'incoming');
      const config = getNodeById(gameState.fs, '.config');

      let alertMsg = '';
      if (workspace && workspace.children?.some((n) => n.name === 'alert_traffic.log')) {
        alertMsg = 'WARNING: High-bandwidth anomaly detected. Traffic log quarantined in workspace.';
      } else if (incoming && incoming.children?.some((n) => n.id === 'scen-b2')) {
        alertMsg = 'WARNING: Unauthorized packet trace intercepted. Source file isolated in ~/incoming.';
      } else if (
        workspace &&
        workspace.children?.some((n) => n.id === 'scen-b3-1' || n.id === 'scen-b3-2')
      ) {
        alertMsg = 'WARNING: Heuristic swarm activity detected. Temporary scan files generated in workspace.';
      } else if (config && config.children?.some((n) => n.id === 'scen-a2')) {
        alertMsg = 'WARNING: Process instability detected. Core dump written to .config.';
      } else if (workspace && workspace.children?.some((n) => n.id === 'scen-a3')) {
        alertMsg = 'WARNING: Dependency failure. Error log generated.';
      }

      if (alertMsg && gameState.alertMessage !== alertMsg) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { alertMessage: alertMsg, showThreatAlert: true },
        });
      }
    }

    // Level 11: Reconnaissance Logic
    if (currentLevel.id === 11) {
       // Scouted files logic is handled in App.tsx effects (updates flags).
       // Narrative system just watches flags?
       // "HONEYPOT TRIGGERED! Security trace initiated."

       // We need to check if selected nodes have honeypot content.
       if (gameState.selectedIds.length > 0) {
         // Same logic as Level 12 but for Level 11
         const parentNode = getNodeById(gameState.fs, gameState.currentPath[gameState.currentPath.length - 1]);
         if (parentNode && parentNode.children) {
            const selectedNodes = parentNode.children.filter(c => gameState.selectedIds.includes(c.id));
            const hasHoneypot = selectedNodes.some(n => n.content?.includes('HONEYPOT'));

            if (hasHoneypot && !gameState.level11Flags?.triggeredHoneypot) {
               dispatch({
                type: 'UPDATE_UI_STATE',
                updates: {
                  alertMessage: '🚨 HONEYPOT TRIGGERED! Security trace initiated. This will have consequences.',
                  showThreatAlert: true,
                  level11Flags: {
                    ...gameState.level11Flags!,
                    triggeredHoneypot: true,
                  },
                },
              });
            }
         }
       }
    }

  }, [gameState.clipboard, gameState.selectedIds, gameState.fs, gameState.levelIndex, gameState.isGameOver, gameState.showThreatAlert, gameState.level11Flags, gameState.alertMessage, gameState.currentPath, dispatch]);

};
