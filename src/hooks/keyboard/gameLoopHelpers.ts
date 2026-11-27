import type React from 'react';
import { LEVELS } from '../../constants/levels';
import type { FileNode, GameState } from '../../types';
import type { Action } from '../gameReducer';
import { handleConfirmDeleteModeKeyDown } from './handleDeleteMode';
import { handleFuzzyModeKeyDown } from './handleFuzzyMode';
import { handleGCommandKeyDown } from './handleGCommandMode';
import { handleNormalModeKeyDown } from './handleNormalMode';
import { handleOverwriteConfirmKeyDown } from './handleOverwriteMode';
import { handleSortModeKeyDown } from './handleSortMode';
import { getActionIntensity, hasBaselineViolation, isProtocolWarningOpen } from './utils';
import { checkAllTasksComplete } from '../../utils/gameUtils';
import { resolvePath } from '../../utils/fsHelpers';

export interface GameLoopDeps {
  gameState: GameState;
  currentLevel: (typeof LEVELS)[number];
  isLastLevel: boolean;
  filePaneEl: HTMLDivElement | null;
  visibleItems: FileNode[];
  parent: FileNode | null | undefined;
  currentItem: FileNode | null;
  dispatch: React.Dispatch<Action>;
  advanceLevel: () => void;
  showNotification: (message: string, duration?: number) => void;
  checkAllTasksComplete: (s: GameState, l: (typeof LEVELS)[number]) => boolean;
}

const isNonGameplayMode = (e: KeyboardEvent, mode: GameState['mode']): boolean => {
  if (['filter', 'input-file', 'rename', 'search'].includes(mode)) return true;
  if (
    (mode === 'zoxide-jump' || mode === 'fzf-current') &&
    !(e.target instanceof HTMLInputElement) &&
    e.key !== 'Escape'
  )
    return true;
  return e.key === 'Tab' && (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || mode !== 'normal');
};

const dispatchModeKey = (e: KeyboardEvent, deps: GameLoopDeps): boolean | void => {
  const {
    gameState,
    currentLevel,
    visibleItems,
    parent,
    currentItem,
    dispatch,
    advanceLevel,
    showNotification,
  } = deps;
  switch (gameState.mode) {
    case 'normal':
      return handleNormalModeKeyDown(e, {
        gameState,
        dispatch,
        items: visibleItems,
        parent: parent || null,
        currentItem,
        currentLevel,
        advanceLevel,
        showNotification,
      });
    case 'sort':
      handleSortModeKeyDown(e, { gameState, dispatch });
      break;
    case 'confirm-delete':
      handleConfirmDeleteModeKeyDown(e, { gameState, dispatch, visibleItems, currentLevel });
      break;
    case 'zoxide-jump':
    case 'fzf-current':
      handleFuzzyModeKeyDown(e, { gameState, dispatch });
      break;
    case 'g-command':
      handleGCommandKeyDown(e, { gameState, dispatch, currentLevel });
      break;
    case 'overwrite-confirm':
      handleOverwriteConfirmKeyDown(e.key, { gameState, dispatch });
      break;
  }
};

export interface SortWarningParams {
  gameState: GameState;
  currentLevel: (typeof LEVELS)[number];
  dispatch: React.Dispatch<Action>;
  confirmWarningModal: (modal: 'sortWarning' | 'filterWarning', tasksComplete: boolean) => void;
  dismissWarning: (modal: 'sortWarning' | 'filterWarning' | 'searchWarning') => void;
}

export const handleSortWarningKey = (e: KeyboardEvent, params: SortWarningParams): boolean => {
  const { gameState, currentLevel, dispatch, confirmWarningModal, dismissWarning } = params;
  if (e.key === 'Tab') return true;
  if (e.key === 'Escape') {
    dismissWarning('sortWarning');
    return true;
  }

  const tasksComplete = checkAllTasksComplete(gameState, currentLevel);
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    confirmWarningModal('sortWarning', tasksComplete);
    return true;
  }
  if (e.key === ',') {
    dispatch({ type: 'SET_MODE', mode: 'sort' });
    dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: true });
    return true;
  }
  if (gameState.acceptNextKeyForSort) {
    handleSortModeKeyDown(e, { gameState, dispatch });
    const pressed = e.key || '';
    const isNatural = pressed.toLowerCase() === 'n' && !e.shiftKey;
    dispatch({ type: 'SET_MODAL_VISIBILITY', modal: 'sortWarning', visible: !isNatural });
    dispatch({ type: 'SET_SORT_KEY_HANDLER', accept: false });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }
  return true;
};

const shouldSkipGameLoopTarget = (
  e: KeyboardEvent,
  filePaneEl: HTMLDivElement | null,
  mode: GameState['mode']
): boolean => {
  const commandPending = mode === 'sort' || mode === 'g-command';
  const inHintModal =
    e.target instanceof Element && Boolean(e.target.closest('[data-testid="hint-modal"]'));
  if (inHintModal && e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' '))
    return true;
  return (
    (mode === 'normal' || commandPending) &&
    !filePaneEl?.contains(e.target as Node) &&
    !inHintModal &&
    e.target !== document.body &&
    e.target !== document.documentElement &&
    !(commandPending && e.key === 'Escape')
  );
};

const IGNORED_KEYSTROKE_KEYS = ['Shift', 'Control', 'Alt', 'Tab', 'Escape', '?', 'm', 'h'];

const shouldCountKeystroke = (e: KeyboardEvent, gameState: GameState): boolean =>
  !isProtocolWarningOpen(gameState) && !IGNORED_KEYSTROKE_KEYS.includes(e.key.toLowerCase());

export const runGameLoopKeyDown = (e: KeyboardEvent, deps: GameLoopDeps): boolean | void => {
  const { gameState, currentLevel, isLastLevel, filePaneEl, dispatch } = deps;
  if (gameState.isBooting || gameState.showEpisodeIntro || isLastLevel || gameState.isGameOver)
    return;
  if (isNonGameplayMode(e, gameState.mode)) return;
  if (shouldSkipGameLoopTarget(e, filePaneEl, gameState.mode)) return;

  if (
    deps.checkAllTasksComplete(gameState, currentLevel) &&
    gameState.showSuccessToast &&
    !hasBaselineViolation(gameState)
  )
    return true;

  if (e.key.toLowerCase() === 'm' && e.altKey && e.shiftKey && gameState.mode === 'normal') {
    e.preventDefault();
    dispatch({ type: 'TOGGLE_SOUND' });
    dispatch({
      type: 'SET_NOTIFICATION',
      message: `Sound ${!gameState.settings.soundEnabled ? 'Enabled' : 'Disabled'}`,
    });
    return true;
  }

  if (shouldCountKeystroke(e, gameState)) {
    const noise = currentLevel?.id >= 11 ? getActionIntensity(e.key, e.ctrlKey) : 1;
    dispatch({ type: 'INCREMENT_KEYSTROKES', weighted: noise > 1 });
  }

  return dispatchModeKey(e, deps) ? true : undefined;
};

export const buildDeleteModalData = (gameState: GameState, visibleList: FileNode[]) => {
  const pendingNodes = gameState.pendingDeleteIds
    .map((id) => visibleList.find((item) => item.id === id))
    .filter((node): node is FileNode => Boolean(node));
  const allDirs = pendingNodes.length > 0 && pendingNodes.every((n) => n.type === 'dir');
  const allFiles = pendingNodes.length > 0 && pendingNodes.every((n) => n.type !== 'dir');
  const itemKind: 'file' | 'folder' | 'item' = allDirs ? 'folder' : allFiles ? 'file' : 'item';
  const currentDir = resolvePath(gameState.fs, gameState.currentPath);
  const itemsToDelete = gameState.pendingDeleteIds.map((id) => {
    const node = visibleList.find((item) => item.id === id);
    return node ? `${currentDir === '/' ? '' : currentDir}/${node.name}` : id;
  });
  return { itemKind, itemsToDelete };
};
