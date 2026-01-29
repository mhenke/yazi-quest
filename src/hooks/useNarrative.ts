import { useEffect, useRef } from 'react';
import { GameState, Level, FileNode } from '../types';
import { Action } from './gameReducer';
import { playTaskCompleteSound } from '../utils/sounds';
import { getNodeById } from '../utils/fsHelpers';
import { getLevel11LegacyThought } from './keyboard/handleNarrativeTriggers';

export const useNarrative = (
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  currentLevel: Level,
  visibleItems: FileNode[]
) => {
  const shownInitialAlertForLevelRef = useRef<number | null>(null);
  const shownThoughtForLevelRef = useRef<number | null>(null);
  const thoughtTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset refs when level changes
  useEffect(() => {
    // If we changed levels, reset the "shown" refs for the new level
    // We check if the currentLevel.id matches the ref, if not, it means we are in a new level context
    // However, since we want to fire ONCE per level, we just let the logic below handle the "if not shown" check.
    // But we need to reset if we go BACK to a level?
    // The previous implementation used `shownInitialAlertForLevelRef.current !== currentLevel.id` to detect change.
  }, [currentLevel.id]);

  // --- Trigger Level-Specific Thoughts (Mid-level / Delayed) ---
  useEffect(() => {
    if (gameState.showEpisodeIntro || gameState.isGameOver) return;

    if (currentLevel.thought && shownThoughtForLevelRef.current !== currentLevel.id) {
      shownThoughtForLevelRef.current = currentLevel.id;

      // Trigger the thought via dispatch
      dispatch({
        type: 'SET_THOUGHT',
        message: currentLevel.thought,
        author: undefined
      });
    }
  }, [
    currentLevel.id,
    currentLevel.thought,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    dispatch,
  ]);

  // --- Task Checking & Level Progression Side Effects ---
  // Note: The actual "Check Task" logic is complex because it modifies state.
  // Ideally, `useNarrative` monitors *changes* in tasks, but here we are responsible for *running* the checks?
  // In the original App.tsx, the `useEffect` runs on every render/dependency change and calls `task.check()`.
  // We will preserve that behavior here to separate it from UI rendering.

  useEffect(() => {
    const isLastLevel = gameState.levelIndex >= 15; // Assuming 15 levels (0-15? No, LEVELS.length)
    // We can't easily check LEVELS.length without importing it, but isLastLevel is usually passed or derived.
    // For now, we'll rely on safeguards inside task.check or just let it run if tasks exist.

    if (gameState.isGameOver) return;

    let changed = false;
    const newlyCompleted: string[] = [];

    currentLevel.tasks.forEach((task) => {
      // We only check uncompleted tasks
      if (!task.completed && task.check(gameState, currentLevel)) {
        newlyCompleted.push(task.id);
        changed = true;
        playTaskCompleteSound(gameState.settings.soundEnabled);

        // Narrative Side Effect: Level 7 Honeypot Alert
        if (currentLevel.id === 7 && task.id === 'zoxide-vault') {
          dispatch({
            type: 'SET_ALERT',
            message: "🚨 HONEYPOT DETECTED - File 'access_token.key' is a security trap! Abort operation immediately.",
            show: true
          });
        }
      }
    });

    if (changed) {
      // Update tasks first
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
            completedTaskIds: {
                ...gameState.completedTaskIds,
                [currentLevel.id]: [
                    ...(gameState.completedTaskIds[currentLevel.id] || []),
                    ...newlyCompleted,
                ],
            }
        }
      });

      // Level 15 Gauntlet Logic
      if (currentLevel.id === 15) {
        const nextPhase = (gameState.gauntletPhase || 0) + 1;
        const currentScore = (gameState.gauntletScore || 0) + 1;
        const isFinished = nextPhase >= 8;

        if (isFinished) {
          if (currentScore < 6) {
            dispatch({ type: 'GAME_OVER', reason: 'keystrokes' });
            dispatch({ type: 'SET_NOTIFICATION', message: `MASTERY FAILED: Score ${currentScore}/8. (Req: 6/8)` });
            return;
          }
          dispatch({ type: 'UPDATE_UI_STATE', updates: { gauntletScore: currentScore } });
          dispatch({ type: 'SET_NOTIFICATION', message: `GAUNTLET CLEARED: Score ${currentScore}/8` });
        } else {
          dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                  gauntletPhase: nextPhase,
                  gauntletScore: currentScore,
                  timeLeft: 20
              }
          });
          dispatch({ type: 'SET_NOTIFICATION', message: `PHASE ${nextPhase + 1} START` });
        }
      }
    }
  }, [
    gameState, // This dependency is heavy, but necessary for task.check(gameState)
    currentLevel,
    dispatch,
  ]);

  // --- Threat & Anomaly Monitoring ---
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro) return;

    const levelId = currentLevel.id;

    // Level 5: Quarantine Alert (only show once per level entry)
    if (levelId === 5 && shownInitialAlertForLevelRef.current !== 5) {
      shownInitialAlertForLevelRef.current = 5;
      dispatch({
        type: 'SET_ALERT',
        message: '🚨 QUARANTINE ALERT - Protocols flagged for lockdown due to active UPLINK configurations. Evacuate immediately.',
        show: true
      });
      return;
    }

    // Reset alert ref if we leave level 5 (handled by logic logic implicitly if we re-enter?)
    // Actually, we need to clear the ref if we are NOT in level 5, so we can show it again if we return?
    if (levelId !== 5 && shownInitialAlertForLevelRef.current === 5) {
       shownInitialAlertForLevelRef.current = null;
    }

    // Level 12: Scenario-specific Anomaly Alerts
    if (levelId === 12) {
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

      if (alertMsg && alertMsg !== gameState.alertMessage) {
         if (!gameState.showThreatAlert) {
            dispatch({
                type: 'SET_ALERT',
                message: alertMsg,
                show: true
            });
         }
      }
    }
  }, [
    gameState.levelIndex,
    gameState.isGameOver,
    gameState.showEpisodeIntro,
    gameState.showThreatAlert,
    currentLevel.id,
    gameState.fs,
    dispatch,
    gameState.alertMessage
  ]);

  // Level 11: Reconnaissance Logic
  useEffect(() => {
    if (currentLevel.id === 11) {
      // 1. Scouted Files Logic
      if (gameState.showInfoPanel && gameState.fs) {
          // We need the current item... passed as prop?
          // Since we don't have currentItem passed explicitly yet (it was calculated in App),
          // we might need to rely on selectedIds or pass currentItem.
          // For now, let's look at `visibleItems` and `gameState.cursorIndex`.
          const currentItem = visibleItems[gameState.cursorIndex];

          if (currentItem) {
            const scouted = gameState.level11Flags?.scoutedFiles || [];
            if (!scouted.includes(currentItem.id)) {
                dispatch({
                    type: 'UPDATE_LEVEL_FLAGS',
                    flags: {
                        scoutedFiles: [...scouted, currentItem.id]
                    }
                });
            }
          }
      }

      // 2. Honeypot Logic (Selection)
      const selectedNodes = visibleItems.filter((n) =>
        gameState.selectedIds.includes(n.id)
      );
      const hasHoneypot = selectedNodes.some((n) => n.content?.includes('HONEYPOT'));

      if (hasHoneypot && !gameState.level11Flags?.triggeredHoneypot) {
        dispatch({
          type: 'SET_ALERT',
          message: '🚨 HONEYPOT TRIGGERED! Security trace initiated. This will have consequences.',
          show: true
        });
        dispatch({ type: 'UPDATE_LEVEL_FLAGS', flags: { triggeredHoneypot: true } });
      }
    }
  }, [
      currentLevel.id,
      gameState.showInfoPanel,
      gameState.cursorIndex,
      gameState.selectedIds,
      gameState.level11Flags,
      visibleItems,
      dispatch
  ]);

  // Level 6 & 12: Honeypot Detection (Clipboard/Selection) & Level 11 Legacy Thought
  useEffect(() => {
    if (currentLevel.id === 11 && gameState.clipboard) {
      const legacyThought = getLevel11LegacyThought(
        gameState.clipboard.nodes,
        gameState.levelIndex
      );
      if (legacyThought) {
        dispatch({
          type: 'SET_THOUGHT',
          message: legacyThought,
          author: 'AI-7734',
        });
      }
    }

    if (currentLevel.id === 6) {
      const hasClipboardHoneypot = gameState.clipboard?.nodes?.some((n) =>
        n.content?.includes('HONEYPOT')
      );

      if (hasClipboardHoneypot && !gameState.showThreatAlert) {
        dispatch({
          type: 'SET_ALERT',
          message: 'PROTOCOL VIOLATION: Active process file locked. You cannot move system locks.',
          show: true
        });
      }
    } else if (currentLevel.id === 12) {
      const selectedNodes = visibleItems.filter((n) =>
        gameState.selectedIds.includes(n.id)
      );
      const hasHoneypot = selectedNodes.some((n) => n.content?.includes('HONEYPOT'));

      if (hasHoneypot && !gameState.showThreatAlert) {
        dispatch({
          type: 'SET_ALERT',
          message: '⚠️ CAUTION: You have selected a valid SYSTEM FILE (Honeypot). Deselect immediately or risk protocol violation.',
          show: true
        });
      }
    }
  }, [
      currentLevel.id,
      gameState.clipboard,
      gameState.selectedIds,
      gameState.showThreatAlert,
      visibleItems,
      dispatch
  ]);

  return {
     // Expose refs or methods if needed, mostly this hook is for side-effects
     resetLevelAlerts: () => {
         shownInitialAlertForLevelRef.current = null;
         shownThoughtForLevelRef.current = null;
     }
  };
};
