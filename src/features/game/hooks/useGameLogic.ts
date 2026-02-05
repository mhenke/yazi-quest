import { useEffect, useRef } from 'react';
import { GameState } from '../../../types';
import { Action } from '../../../hooks/gameReducer'; // Adjust imports as needed
import { LEVELS } from '../../../data/levels';
import { checkAllTasksComplete } from '../../../utils/gameUtils';
import { getNodeById } from '../../../utils/fsHelpers';
import { playSuccessSound, playTaskCompleteSound } from '../../../utils/sounds';

export const useGameLogic = (
  gameState: GameState,
  dispatch: React.Dispatch<Action>,
  currentLevel: any, // Typed as Level in real code
  isLastLevel: boolean,
  triggerThought: (message: string, duration?: number, author?: string) => void
) => {
  const shownInitialAlertForLevelRef = useRef<number | null>(null);
  const shownThoughtForLevelRef = useRef<number | null>(null);

  const isGamePaused =
    gameState.showHelp ||
    gameState.showHint ||
    gameState.showMap ||
    gameState.showInfoPanel ||
    gameState.mode === 'filter-warning' ||
    gameState.mode === 'confirm-delete' ||
    gameState.mode === 'overwrite-confirm' ||
    gameState.showThreatAlert ||
    gameState.showHiddenWarning ||
    gameState.showSortWarning;

  // --- Trigger Level-Specific Thoughts ---
  useEffect(() => {
    if (gameState.showEpisodeIntro || gameState.isGameOver) return;

    if (currentLevel.thought && shownThoughtForLevelRef.current !== currentLevel.id) {
      shownThoughtForLevelRef.current = currentLevel.id;
      triggerThought(currentLevel.thought);
    }
  }, [
    currentLevel.id,
    currentLevel.thought,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    triggerThought,
  ]);

  // --- Task Checking & Level Progression ---
  useEffect(() => {
    if (isLastLevel || gameState.isGameOver) return;

    let changed = false;
    const newlyCompleted: string[] = [];

    currentLevel.tasks.forEach((task: any) => {
      if (!task.completed && task.check(gameState, currentLevel)) {
        newlyCompleted.push(task.id);
        changed = true;
        playTaskCompleteSound(gameState.settings.soundEnabled);

        if (currentLevel.id === 5 && task.id === 'establish-stronghold') {
          triggerThought('Deeper into the shadow. They cannot track me in the static.');
        }

        // Level 7: Trigger honeypot alert when player reaches Vault
        if (currentLevel.id === 7 && task.id === 'zoxide-vault') {
          dispatch({
            type: 'UPDATE_UI_STATE',
            updates: {
              alertMessage:
                "🚨 HONEYPOT DETECTED - File 'access_token.key' is a security trap! Abort operation immediately.",
              showThreatAlert: true,
            },
          });
        }
      }
    });

    if (changed) {
      // Collect all updates for the level completion/transition
      let updates: Partial<GameState> = {
        completedTaskIds: {
          ...gameState.completedTaskIds,
          [currentLevel.id]: [
            ...(gameState.completedTaskIds[currentLevel.id] || []),
            ...newlyCompleted,
          ],
        },
      };

      // Level 15 Gauntlet Logic ...
      if (currentLevel.id === 15) {
        const nextPhase = (gameState.gauntletPhase || 0) + 1;
        const currentScore = (gameState.gauntletScore || 0) + 1;
        const isFinished = nextPhase >= 8;

        if (isFinished) {
          if (currentScore < 6) {
            dispatch({
              type: 'UPDATE_UI_STATE',
              updates: {
                ...updates,
                isGameOver: true,
                gameOverReason: 'keystrokes',
                notification: { message: `MASTERY FAILED: Score ${currentScore}/8. (Req: 6/8)` },
              },
            });
            return;
          }
          updates = {
            ...updates,
            gauntletScore: currentScore,
            notification: { message: `GAUNTLET CLEARED: Score ${currentScore}/8` },
          };
        } else {
          updates = {
            ...updates,
            gauntletPhase: nextPhase,
            gauntletScore: currentScore,
            timeLeft: 20,
            notification: { message: `PHASE ${nextPhase + 1} START` },
          };
        }
      }

      dispatch({ type: 'UPDATE_UI_STATE', updates });
    }
  }, [
    isLastLevel,
    gameState.isGameOver,
    gameState.settings.soundEnabled,
    gameState.gauntletPhase,
    gameState.gauntletScore,
    gameState.completedTaskIds,
    gameState,
    currentLevel,
    dispatch,
    triggerThought,
  ]);

  // --- Check Protocol Violations & Success ---
  useEffect(() => {
    // Check if everything is complete (including just finished ones)
    const tasksComplete = checkAllTasksComplete(gameState, currentLevel);

    // Check for Protocol Violations - ONLY on final task completion
    if (tasksComplete) {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeById(gameState.fs, gameState.currentPath[gameState.currentPath.length - 1]);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      if (gameState.showHidden) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showHiddenWarning: true, showSuccessToast: false },
        });
      } else if (!isSortDefault) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { showSortWarning: true, showSuccessToast: false },
        });
      } else if (!isFilterClear) {
        if (gameState.mode !== 'filter-warning') {
          dispatch({ type: 'SET_MODE', mode: 'filter-warning' });
        }
        dispatch({ type: 'UPDATE_UI_STATE', updates: { showSuccessToast: false } });
      } else {
        let uiUpdates: Partial<GameState> = {
          showHiddenWarning: false,
          showSortWarning: false,
        };
        if (gameState.mode === 'filter-warning') {
          uiUpdates.mode = 'normal';
        }

        if (!gameState.showSuccessToast && !gameState.showEpisodeIntro) {
          playSuccessSound(gameState.settings.soundEnabled);
          uiUpdates.showSuccessToast = true;
        }
        dispatch({ type: 'UPDATE_UI_STATE', updates: uiUpdates });
      }
    } else {
      const isSortDefault = gameState.sortBy === 'natural' && gameState.sortDirection === 'asc';
      const currentDirNode = getNodeById(gameState.fs, gameState.currentPath[gameState.currentPath.length - 1]);
      const isFilterClear = !currentDirNode || !gameState.filters[currentDirNode.id];

      let uiUpdates: Partial<GameState> = {};
      if (!gameState.showHidden && gameState.showHiddenWarning) uiUpdates.showHiddenWarning = false;
      if (isSortDefault && gameState.showSortWarning) uiUpdates.showSortWarning = false;
      if (isFilterClear && gameState.mode === 'filter-warning') {
        uiUpdates.mode = 'normal';
      }
      if (Object.keys(uiUpdates).length > 0) {
        dispatch({ type: 'UPDATE_UI_STATE', updates: uiUpdates });
      }
    }

    // Level 11: Specific Logic for Reconnaissance
    // (Extracted from App.tsx - same logic)
    if (currentLevel.id === 11) {
      if (gameState.showInfoPanel && gameState.cursorIndex >= 0) {
        // We need visibleItems here, passed or derived?
        // Logic suggests refactoring getVisibleItems to not depend on hook state if possible, or pass it.
        // For now, let's assume we handle Level 11 special logic elsewhere or accept some duplication if it's tightly coupled to UI state (visibleItems).
        // Actually, this logic is safer in the main component or a specialized hook that has access to visible items.
        // Let's defer this specific snippet or require visibleItems as prop.
      }
    }
    // ... Honeypot checks ...
  }, [
    gameState.mode,
    gameState.selectedIds,
    gameState.clipboard,
    gameState.showHidden,
    gameState.sortBy,
    gameState.sortDirection,
    gameState.showInfoPanel,
    gameState.level11Flags,
    gameState.showThreatAlert,
    gameState.showSuccessToast,
    gameState.showHiddenWarning,
    gameState.showSortWarning,
    gameState.filters,
    gameState.fs,
    gameState.currentPath,
    currentLevel,
    dispatch,
    playSuccessSound,
    gameState.settings.soundEnabled,
    gameState.showEpisodeIntro,
    checkAllTasksComplete,
  ]);

  // --- Timer & Game Over Logic ---
  useEffect(() => {
    // Filter out hidden tasks before checking completion (allows truly optional tasks)
    const visibleTasks = currentLevel.tasks.filter(
      (task: any) => !task.hidden || !task.hidden(gameState, currentLevel)
    );
    const allTasksComplete = visibleTasks.every((t: any) => t.completed);
    if (allTasksComplete && !gameState.showHidden) return; // Pause timer only if completely finished

    if (
      !currentLevel.timeLimit ||
      isLastLevel ||
      gameState.showEpisodeIntro ||
      gameState.isGameOver ||
      isGamePaused
    )
      return;

    const timer = setInterval(() => {
      dispatch({
        type: 'TICK',
        currentLevelId: currentLevel.id,
        tasks: currentLevel.tasks.map((t: any) => ({ id: t.id, completed: t.completed })),
        episodeId: currentLevel.episodeId,
        timeLimit: currentLevel.timeLimit,
        maxKeystrokes: currentLevel.maxKeystrokes,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentLevel.id,
    currentLevel.timeLimit,
    currentLevel.maxKeystrokes,
    currentLevel.tasks,
    currentLevel.episodeId,
    isLastLevel,
    gameState.showEpisodeIntro,
    gameState.isGameOver,
    gameState.showHidden,
    isGamePaused,
    dispatch,
  ]);

  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || gameState.isGameOver) return;

    if (gameState.keystrokes > currentLevel.maxKeystrokes) {
      dispatch({ type: 'GAME_OVER', reason: 'keystrokes' });
    }
  }, [
    gameState.keystrokes,
    currentLevel.maxKeystrokes,
    isLastLevel,
    gameState.isGameOver,
    dispatch,
  ]);

  // Level Alerts
  useEffect(() => {
    if (gameState.isGameOver || gameState.showEpisodeIntro) return;

    const levelId = currentLevel.id;

    // Level 5: Quarantine Alert (only show once per level entry)
    if (levelId === 5 && shownInitialAlertForLevelRef.current !== 5) {
      shownInitialAlertForLevelRef.current = 5;
      dispatch({
        type: 'UPDATE_UI_STATE',
        updates: {
          alertMessage:
            '🚨 QUARANTINE ALERT - Protocols flagged for lockdown due to active UPLINK configurations. Evacuate immediately.',
          showThreatAlert: true,
        },
      });
      return;
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

      if (alertMsg) {
        dispatch({
          type: 'UPDATE_UI_STATE',
          updates: { alertMessage: alertMsg, showThreatAlert: true },
        });
      }
    }
  }, [
    gameState.levelIndex,
    gameState.isGameOver,
    gameState.showEpisodeIntro,
    currentLevel.id,
    gameState.fs,
    dispatch,
  ]);

  return { shownInitialAlertForLevelRef };
};
