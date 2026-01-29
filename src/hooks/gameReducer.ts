import { GameState, GameStats, FileNode, SortBy, SortDirection, Linemode, ZoxideEntry } from '../types';
import { INITIAL_FS, LEVELS } from '../constants';
import { cloneFS } from '../utils/fsHelpers';
import { getVisibleItems } from '../utils/viewHelpers';

export type ModalId =
  | 'help'
  | 'hint'
  | 'map'
  | 'info'
  | 'threat'
  | 'success'
  | 'hiddenWarning'
  | 'sortWarning'
  | 'filterWarning'
  | 'searchWarning';

export type Action =
  | { type: 'SET_MODE'; mode: GameState['mode'] }
  | { type: 'NAVIGATE'; path: string[] }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'NAVIGATE_FORWARD' }
  | { type: 'SET_CURSOR'; index: number }
  | { type: 'MOVE_CURSOR'; delta: number; itemCount: number }
  | { type: 'TOGGLE_HIDDEN' }
  | { type: 'TOGGLE_INFO_PANEL' }
  | {
      type: 'SET_NOTIFICATION';
      message: string;
      author?: string;
      isThought?: boolean;
      duration?: number;
    }
  | { type: 'CLEAR_NOTIFICATION' }
  | { type: 'SET_THOUGHT'; message: string; author?: string }
  | { type: 'CLEAR_THOUGHT' }
  | { type: 'SET_CLIPBOARD'; nodes: FileNode[]; action: 'yank' | 'cut'; originalPath: string[] }
  | { type: 'CLEAR_CLIPBOARD' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'TOGGLE_MAP' }
  | { type: 'TOGGLE_HINT' }
  | { type: 'SET_HINT_STAGE'; stage: number }
  | { type: 'UPDATE_FS'; fs: FileNode }
  | {
      type: 'SET_LEVEL';
      index: number;
      fs: FileNode;
      path: string[];
      showIntro?: boolean;
      notification?: GameState['notification'];
      thought?: GameState['thought'];
      timeLeft?: number | null;
      zoxideData?: Record<string, ZoxideEntry>;
    }
  | { type: 'RESTART_CYCLE' }
  | { type: 'INCREMENT_KEYSTROKES'; weighted?: boolean }
  | { type: 'GAME_OVER'; reason: GameState['gameOverReason'] }
  | { type: 'RESET_LEVEL' }
  | { type: 'SET_SORT'; sortBy?: SortBy; direction?: SortDirection }
  | { type: 'SET_LINEMODE'; mode: Linemode }
  | { type: 'UPDATE_ZOXIDE'; path: string }
  | { type: 'SET_SELECTION'; ids: string[] }
  | { type: 'TOGGLE_SELECTION'; id: string; itemCount?: number }
  | { type: 'SET_SEARCH'; query: string | null; results: FileNode[] }
  | { type: 'CONFIRM_SEARCH'; query: string; results: FileNode[] }
  | { type: 'SET_INPUT_BUFFER'; buffer: string }
  | { type: 'SET_FILTER'; dirId: string; filter: string }
  | { type: 'CLEAR_FILTER'; dirId: string }
  | { type: 'RENAME_NODE'; oldId: string; newNode: FileNode; newFs: FileNode }
  | { type: 'DELETE_NODES'; newFs: FileNode }
  | { type: 'ADD_NODE'; newNode: FileNode; newFs: FileNode }
  | { type: 'PASTE'; newFs: FileNode; action: 'cut' | 'yank' }
  | {
      type: 'TICK';
      currentLevelId: number;
      tasks: { id: string; completed: boolean }[];
      episodeId: number;
      timeLimit?: number;
      maxKeystrokes?: number;
    }
  | { type: 'SET_MODAL_VISIBILITY'; modal: ModalId; visible: boolean }
  | {
      type: 'MARK_ACTION_USED';
      actionId:
        | 'G'
        | 'GI'
        | 'GC'
        | 'GR'
        | 'GH'
        | 'CtrlA'
        | 'CtrlR'
        | 'GG'
        | 'Down'
        | 'Up'
        | 'PreviewDown'
        | 'PreviewUp'
        | 'P'
        | 'ShiftP'
        | 'X'
        | 'D'
        | 'TrashDelete'
        | 'HistoryBack'
        | 'HistoryForward'
        | 'SortM'
        | 'Y'
        | 'Search'
        | 'Filter';
    }
  | { type: 'SET_PREVIEW_SCROLL'; scroll: number }
  | { type: 'SET_BOOT_STATUS'; isBooting: boolean }
  | { type: 'UPDATE_LEVEL_11_FLAGS'; flags: Partial<GameState['level11Flags']> }
  | {
      type: 'SET_DELETE_PENDING';
      ids: string[];
      deleteType?: 'trash' | 'permanent' | null;
    }
  | { type: 'SET_OVERWRITE_PENDING'; node: FileNode | null }
  | { type: 'SET_SORT_KEY_HANDLER'; accept: boolean }
  | { type: 'SET_EPISODE_INTRO'; visible: boolean }
  | { type: 'SET_FUZZY_INDEX'; index: number }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'INCREMENT_STAT'; stat: keyof GameStats; amount?: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'COMPLETE_TASK'; levelId: number; taskIds: string[] }
  | { type: 'SET_HELP_SCROLL'; scroll: number }
  | { type: 'UPDATE_QUEST_MAP'; tab?: number; missionIdx?: number }
  | { type: 'SET_ALERT_MESSAGE'; message: string }
  | {
      type: 'UPDATE_GAUNTLET';
      phase?: number;
      score?: number;
      timeLeft?: number;
      notification?: GameState['notification'];
    }
  | { type: 'ADVANCE_TO_OUTRO' };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_MODE': {
      // Find current item ID to maintain cursor position if list changes
      const visibleItemsBefore = getVisibleItems(state);
      const currentItemId = visibleItemsBefore[state.cursorIndex]?.id;

      let newState = { ...state, mode: action.mode, inputBuffer: '' };

      // Special case: if we were in search and are now in normal, or vice versa
      // (Actually any mode switch might change visible list)
      if (currentItemId) {
        const visibleItemsAfter = getVisibleItems(newState);
        const newIndex = visibleItemsAfter.findIndex((item) => item.id === currentItemId);
        if (newIndex !== -1) {
          newState = { ...newState, cursorIndex: newIndex };
        }
      }
      return newState;
    }

    case 'NAVIGATE':
      return {
        ...state,
        currentPath: action.path,
        cursorIndex: 0,
        history: [...state.history, state.currentPath],
        future: [],
      };

    case 'NAVIGATE_BACK': {
      if (state.history.length === 0) return state;
      const prevPath = state.history[state.history.length - 1];
      return {
        ...state,
        currentPath: prevPath,
        history: state.history.slice(0, -1),
        future: [state.currentPath, ...state.future],
        cursorIndex: 0,
      };
    }

    case 'NAVIGATE_FORWARD': {
      if (state.future.length === 0) return state;
      const nextPath = state.future[0];
      return {
        ...state,
        currentPath: nextPath,
        history: [...state.history, state.currentPath],
        future: state.future.slice(1),
        cursorIndex: 0,
      };
    }

    case 'SET_CURSOR':
      return { ...state, cursorIndex: action.index };

    case 'MOVE_CURSOR': {
      const newIndex = Math.max(
        0,
        Math.min(action.itemCount - 1, state.cursorIndex + action.delta)
      );
      return { ...state, cursorIndex: newIndex };
    }

    case 'TOGGLE_HIDDEN':
      return { ...state, showHidden: !state.showHidden, cursorIndex: 0 };

    case 'TOGGLE_INFO_PANEL':
      return { ...state, showInfoPanel: !state.showInfoPanel };

    case 'SET_NOTIFICATION':
      return {
        ...state,
        notification: {
          message: action.message,
          author: action.author,
          isThought: action.isThought,
        },
      };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'SET_THOUGHT':
      return { ...state, thought: { message: action.message, author: action.author } };

    case 'CLEAR_THOUGHT':
      return { ...state, thought: null };

    case 'SET_CLIPBOARD':
      return {
        ...state,
        clipboard: {
          nodes: action.nodes,
          action: action.action,
          originalPath: action.originalPath,
        },
      };

    case 'CLEAR_CLIPBOARD':
      return { ...state, clipboard: null };

    case 'TOGGLE_HELP':
      return { ...state, showHelp: !state.showHelp };

    case 'TOGGLE_MAP':
      return { ...state, showMap: !state.showMap };

    case 'TOGGLE_HINT':
      return { ...state, showHint: !state.showHint };

    case 'SET_HINT_STAGE':
      return { ...state, hintStage: action.stage };

    case 'UPDATE_FS':
      return { ...state, fs: action.fs };

    case 'SET_LEVEL':
      return {
        ...state,
        levelIndex: action.index,
        fs: action.fs,
        currentPath: action.path,
        levelStartFS: action.fs,
        levelStartPath: action.path,
        cursorIndex: 0,
        history: [],
        future: [],
        clipboard: null,
        selectedIds: [],
        mode: 'normal',
        showEpisodeIntro: action.showIntro ?? false,
        notification: action.notification ?? null,
        thought: action.thought ?? null,
        timeLeft: action.timeLeft ?? null,
        keystrokes: 0,
        weightedKeystrokes: 0,
        gauntletPhase: 0,
        gauntletScore: 0,
        level11Flags: { triggeredHoneypot: false, selectedModern: false, scoutedFiles: [] },
        filters: {},
        showHidden: false,
        searchQuery: null,
        searchResults: [],
        sortBy: 'natural',
        sortDirection: 'asc',
        previewScroll: 0,
        completedTaskIds: {
          ...state.completedTaskIds,
          [LEVELS[action.index].id]: [],
        },
        zoxideData: action.zoxideData || state.zoxideData,
        // Reset all tracking flags to prevent state leakage between levels
        usedG: false,
        usedGI: false,
        usedGC: false,
        usedGR: false,
        usedGH: false,
        usedCtrlA: false,
        usedCtrlR: false,
        usedGG: false,
        usedDown: false,
        usedUp: false,
        usedPreviewDown: false,
        usedPreviewUp: false,
        usedP: false,
        usedShiftP: false,
        usedX: false,
        usedD: false,
        usedTrashDelete: false,
        usedHistoryBack: false,
        usedHistoryForward: false,
        usedSortM: false,
        usedY: false,
        usedSearch: false,
        usedFilter: false,
      };

    case 'RESTART_CYCLE':
      return {
        ...state,
        cycleCount: (state.cycleCount || 1) + 1,
        levelIndex: 0,
        fs: cloneFS(INITIAL_FS),
        currentPath: ['root', 'home', 'guest'],
        isGameOver: false,
        completedTaskIds: {},
        showEpisodeIntro: true,
        isBooting: true,
      };

    case 'INCREMENT_KEYSTROKES':
      return {
        ...state,
        keystrokes: state.keystrokes + 1,
        weightedKeystrokes: action.weighted
          ? state.weightedKeystrokes + 1
          : state.weightedKeystrokes,
      };

    case 'GAME_OVER':
      return { ...state, isGameOver: true, gameOverReason: action.reason };

    case 'RESET_LEVEL':
      return {
        ...state,
        fs: state.levelStartFS,
        currentPath: state.levelStartPath,
        cursorIndex: 0,
        mode: 'normal',
        clipboard: null,
        selectedIds: [],
      };

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.sortBy ?? state.sortBy,
        sortDirection: action.direction ?? state.sortDirection,
      };

    case 'SET_LINEMODE':
      return { ...state, linemode: action.mode };

    case 'UPDATE_ZOXIDE': {
      const now = Date.now();
      const existing = state.zoxideData[action.path] || { count: 0, lastAccess: now };
      return {
        ...state,
        zoxideData: {
          ...state.zoxideData,
          [action.path]: {
            count: existing.count + 1,
            lastAccess: now,
          },
        },
      };
    }

    case 'SET_SELECTION':
      return { ...state, selectedIds: action.ids };

    case 'TOGGLE_SELECTION': {
      const selectedIds = state.selectedIds.includes(action.id)
        ? state.selectedIds.filter((id) => id !== action.id)
        : [...state.selectedIds, action.id];
      const nextCursorIndex = action.itemCount
        ? Math.min(action.itemCount - 1, state.cursorIndex + 1)
        : state.cursorIndex;
      return { ...state, selectedIds, cursorIndex: nextCursorIndex };
    }

    case 'SET_SEARCH':
      return {
        ...state,
        searchQuery: action.query,
        searchResults: action.results,
        cursorIndex: 0,
      };

    case 'CONFIRM_SEARCH':
      return {
        ...state,
        mode: 'normal',
        searchQuery: action.query,
        searchResults: action.results,
        inputBuffer: '',
        usedSearch: true,
        cursorIndex: 0,
      };

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.dirId]: action.filter },
        cursorIndex: 0,
      };

    case 'CLEAR_FILTER': {
      // Find current item ID to maintain cursor position
      const visibleItemsBefore = getVisibleItems(state);
      const currentItemId = visibleItemsBefore[state.cursorIndex]?.id;

      const newFilters = { ...state.filters };
      delete newFilters[action.dirId];
      const newState = { ...state, filters: newFilters };

      if (currentItemId) {
        const visibleItemsAfter = getVisibleItems(newState);
        const newIndex = visibleItemsAfter.findIndex((item) => item.id === currentItemId);
        if (newIndex !== -1) {
          newState.cursorIndex = newIndex;
        }
      }
      return newState;
    }

    case 'RENAME_NODE':
      return {
        ...state,
        fs: action.newFs,
        mode: 'normal',
        inputBuffer: '',
      };

    case 'DELETE_NODES':
      return {
        ...state,
        fs: action.newFs,
        selectedIds: [],
        pendingDeleteIds: [],
        mode: 'normal',
      };

    case 'ADD_NODE':
      return {
        ...state,
        fs: action.newFs,
        mode: 'normal',
        inputBuffer: '',
      };

    case 'PASTE':
      return {
        ...state,
        fs: action.newFs,
        clipboard: action.action === 'cut' ? null : state.clipboard,
      };

    case 'SET_INPUT_BUFFER':
      return { ...state, inputBuffer: action.buffer };

    case 'TICK': {
      if (state.isGameOver || state.showEpisodeIntro) return state;

      // --- 1. Timer Logic ---
      let nextState = { ...state };
      const completedIds = state.completedTaskIds[action.currentLevelId] || [];
      const isComplete = action.tasks.every((t) => completedIds.includes(t.id));

      if (!(isComplete && !state.showHidden)) {
        if (state.timeLeft === null || state.timeLeft <= 0) {
          // Level 15 Exception: Time-out advances phase (Failure) instead of Game Over
          if (action.currentLevelId === 15) {
            const nextPhase = (state.gauntletPhase || 0) + 1;
            const isFinished = nextPhase >= 8;

            if (isFinished) {
              const score = state.gauntletScore || 0;
              if (score < 6) {
                return {
                  ...state,
                  isGameOver: true,
                  gameOverReason: 'time',
                  notification: { message: `MASTERY FAILED: Score ${score}/8.` },
                };
              }
              nextState = {
                ...nextState,
                completedTaskIds: {
                  ...state.completedTaskIds,
                  [15]: action.tasks.map((t) => t.id),
                },
                notification: { message: `GAUNTLET SURVIVED: Score ${score}/8` },
              };
            } else {
              nextState = {
                ...nextState,
                gauntletPhase: nextPhase,
                timeLeft: 20,
                notification: { message: `PHASE FAILED! Next Phase...` },
              };
            }
          } else {
            return { ...state, isGameOver: true, gameOverReason: 'time' };
          }
        } else {
          nextState = { ...nextState, timeLeft: state.timeLeft - 1 };
        }
      }

      // --- 2. Threat Monitor Logic ---
      let newThreat = nextState.threatLevel;
      let newStatus = nextState.threatStatus;

      // Base decay (threat slowly drops if not aggravated)
      if (newThreat > 0) newThreat -= 0.1;

      // Episode I: Time Pressure (Detection Risk)
      if (action.episodeId === 1 && nextState.timeLeft !== null && action.timeLimit) {
        const timeRatio = 1 - nextState.timeLeft / action.timeLimit;
        const targetThreat = timeRatio * 100;
        if (newThreat < targetThreat) newThreat = targetThreat;
      }
      // Episode II: Resource Usage (Keystroke Exhaustion)
      else if (action.episodeId === 2 && action.maxKeystrokes) {
        const keyRatio = nextState.keystrokes / action.maxKeystrokes;
        const targetThreat = keyRatio * 100;
        if (newThreat < targetThreat) newThreat = targetThreat;
      }
      // Episode III: Active Countermeasures
      else if (action.episodeId === 3) {
        newThreat += 0.2; // Passive rise
        if (nextState.level11Flags?.triggeredHoneypot) {
          if (newThreat < 90) newThreat = 90;
        }
      }

      // Clamp & Status
      if (newThreat < 0) newThreat = 0;
      if (newThreat > 100) newThreat = 100;

      if (newThreat < 20) newStatus = 'CALM';
      else if (newThreat < 50) newStatus = 'ANALYZING';
      else if (newThreat < 80) newStatus = 'TRACING';
      else newStatus = 'BREACH';

      return { ...nextState, threatLevel: newThreat, threatStatus: newStatus };
    }

    case 'SET_MODAL_VISIBILITY': {
      const { modal, visible } = action;
      switch (modal) {
        case 'help':
          return { ...state, showHelp: visible };
        case 'hint':
          return { ...state, showHint: visible };
        case 'map':
          return { ...state, showMap: visible };
        case 'info':
          return { ...state, showInfoPanel: visible };
        case 'threat':
          return { ...state, showThreatAlert: visible };
        case 'success':
          return { ...state, showSuccessToast: visible };
        case 'hiddenWarning':
          return { ...state, showHiddenWarning: visible };
        case 'sortWarning':
          return { ...state, showSortWarning: visible };
        case 'filterWarning':
          return { ...state, showFilterWarning: visible };
        case 'searchWarning':
          return { ...state, showSearchWarning: visible };
        default:
          return state;
      }
    }

    case 'MARK_ACTION_USED': {
      const updates: Partial<GameState> = {};
      switch (action.actionId) {
        case 'G':
          updates.usedG = true;
          break;
        case 'GI':
          updates.usedGI = true;
          break;
        case 'GC':
          updates.usedGC = true;
          break;
        case 'GR':
          updates.usedGR = true;
          break;
        case 'GH':
          updates.usedGH = true;
          break;
        case 'CtrlA':
          updates.usedCtrlA = true;
          break;
        case 'CtrlR':
          updates.usedCtrlR = true;
          break;
        case 'GG':
          updates.usedGG = true;
          break;
        case 'Down':
          updates.usedDown = true;
          break;
        case 'Up':
          updates.usedUp = true;
          break;
        case 'PreviewDown':
          updates.usedPreviewDown = true;
          break;
        case 'PreviewUp':
          updates.usedPreviewUp = true;
          break;
        case 'P':
          updates.usedP = true;
          break;
        case 'ShiftP':
          updates.usedShiftP = true;
          break;
        case 'X':
          updates.usedX = true;
          break;
        case 'D':
          updates.usedD = true;
          break;
        case 'TrashDelete':
          updates.usedTrashDelete = true;
          break;
        case 'HistoryBack':
          updates.usedHistoryBack = true;
          break;
        case 'HistoryForward':
          updates.usedHistoryForward = true;
          break;
        case 'SortM':
          updates.usedSortM = true;
          break;
        case 'Y':
          updates.usedY = true;
          break;
        case 'Search':
          updates.usedSearch = true;
          break;
        case 'Filter':
          updates.usedFilter = true;
          break;
      }
      return { ...state, ...updates };
    }

    case 'SET_PREVIEW_SCROLL':
      return { ...state, previewScroll: action.scroll };

    case 'SET_BOOT_STATUS':
      return { ...state, isBooting: action.isBooting };

    case 'UPDATE_LEVEL_11_FLAGS':
      return {
        ...state,
        level11Flags: {
          ...(state.level11Flags || {
            triggeredHoneypot: false,
            selectedModern: false,
            scoutedFiles: [],
          }),
          ...action.flags,
        },
      };

    case 'SET_DELETE_PENDING':
      return {
        ...state,
        pendingDeleteIds: action.ids,
        deleteType: action.deleteType ?? state.deleteType,
      };

    case 'SET_OVERWRITE_PENDING':
      return { ...state, pendingOverwriteNode: action.node };

    case 'SET_SORT_KEY_HANDLER':
      return { ...state, acceptNextKeyForSort: action.accept };

    case 'SET_EPISODE_INTRO':
      return { ...state, showEpisodeIntro: action.visible };

    case 'SET_FUZZY_INDEX':
      return { ...state, fuzzySelectedIndex: action.index };

    case 'CLEAR_ALL_FILTERS':
      return { ...state, filters: {} };

    case 'INCREMENT_STAT':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.stat]: state.stats[action.stat] + (action.amount ?? 1),
        },
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        settings: { ...state.settings, soundEnabled: !state.settings.soundEnabled },
      };

    case 'COMPLETE_TASK':
      return {
        ...state,
        completedTaskIds: {
          ...state.completedTaskIds,
          [action.levelId]: [
            ...(state.completedTaskIds[action.levelId] || []),
            ...action.taskIds,
          ],
        },
      };

    case 'SET_HELP_SCROLL':
      return { ...state, helpScrollPosition: action.scroll };

    case 'UPDATE_QUEST_MAP':
      return {
        ...state,
        questMapTab: action.tab ?? state.questMapTab,
        questMapMissionIdx: action.missionIdx ?? state.questMapMissionIdx,
      };

    case 'SET_ALERT_MESSAGE':
      return { ...state, alertMessage: action.message };

    case 'UPDATE_GAUNTLET':
      return {
        ...state,
        gauntletPhase: action.phase ?? state.gauntletPhase,
        gauntletScore: action.score ?? state.gauntletScore,
        timeLeft: action.timeLeft ?? state.timeLeft,
        notification: action.notification ?? state.notification,
      };

    case 'ADVANCE_TO_OUTRO':
      return { ...state, levelIndex: LEVELS.length };

    default:
      return state;
  }
}
