import { useEffect } from 'react';
import { Level } from '../types';
import { Action } from './gameReducer';

export interface UseGameTimerProps {
  currentLevel: Level;
  allTasksComplete: boolean;
  isLastLevel: boolean;
  isGamePaused: boolean;
  isBooting: boolean;
  showEpisodeIntro: boolean;
  isGameOver: boolean;
  showHidden: boolean;
  keystrokes: number;
  dispatch: React.Dispatch<Action>;
}

export function useGameTimer({
  currentLevel,
  allTasksComplete,
  isLastLevel,
  isGamePaused,
  isBooting,
  showEpisodeIntro,
  isGameOver,
  showHidden,
  keystrokes,
  dispatch,
}: UseGameTimerProps) {
  const paused = isBooting || showEpisodeIntro || isGamePaused;

  // Countdown timer — dispatches TICK every second when active
  useEffect(() => {
    if (allTasksComplete && !showHidden) return;
    if (!currentLevel.timeLimit || isLastLevel || isGameOver || paused) return;

    const timer = setInterval(() => {
      dispatch({
        type: 'TICK',
        currentLevelId: currentLevel.id,
        tasks: currentLevel.tasks.map((t) => ({ id: t.id, completed: t.completed })),
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
    allTasksComplete,
    isLastLevel,
    paused,
    isGameOver,
    showHidden,
    dispatch,
  ]);

  // Keystroke limit guard — triggers game over when limit exceeded
  useEffect(() => {
    if (!currentLevel.maxKeystrokes || isLastLevel || isGameOver) return;
    if (keystrokes > currentLevel.maxKeystrokes) {
      dispatch({ type: 'GAME_OVER', reason: 'keystrokes' });
    }
  }, [keystrokes, currentLevel.maxKeystrokes, isLastLevel, isGameOver, dispatch]);
}
