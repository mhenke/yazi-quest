import { describe, it, expect } from 'vitest';
import { gameReducer } from './gameReducer';
import { LEVELS } from '../constants/levels';
import type { GameState } from '../types';

/**
 * Alerts are keyed by id and dismissible. An effect can dispatch before state
 * commits (StrictMode double-invoke), so the reducer — not each call site —
 * keeps ids unique, and a dismissed id stays suppressed until the level resets.
 * Regression: Level 6 rendered two "WRITE ACCESS GRANTED" cards and React warned
 * about the duplicate `write-access-l6` key.
 */
describe('gameReducer ADD_ALERT', () => {
  const alert = {
    id: 'write-access-l6',
    title: 'WRITE ACCESS GRANTED',
    message: 'Security protocols lifted for workspace.',
    severity: 'info' as const,
    timestamp: 1,
  };

  const withAlerts = (alerts: GameState['alerts']): GameState => ({ alerts }) as GameState;

  it('appends an alert whose id is new', () => {
    const next = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    expect(next.alerts).toHaveLength(1);
    expect(next.alerts[0].id).toBe('write-access-l6');
  });

  it('ignores a repeat dispatch of the same id', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const second = gameReducer(first, { type: 'ADD_ALERT', payload: alert });

    expect(second.alerts).toHaveLength(1);
    expect(second).toBe(first);
  });

  it('keeps distinct ids side by side', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const next = gameReducer(first, {
      type: 'ADD_ALERT',
      payload: { ...alert, id: 'safety-fail-l14', title: 'SAFETY INTERLOCKS DISABLED' },
    });

    expect(next.alerts.map((a) => a.id)).toEqual(['write-access-l6', 'safety-fail-l14']);
  });

  it('removes only the dismissed id', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const withTwo = gameReducer(first, {
      type: 'ADD_ALERT',
      payload: { ...alert, id: 'safety-fail-l14' },
    });

    const next = gameReducer(withTwo, { type: 'REMOVE_ALERT', id: 'write-access-l6' });

    expect(next.alerts.map((a) => a.id)).toEqual(['safety-fail-l14']);
    expect(next.dismissedAlertIds).toEqual(['write-access-l6']);
  });

  it('does not re-add a dismissed alert within the level', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const removed = gameReducer(first, { type: 'REMOVE_ALERT', id: 'write-access-l6' });

    const readded = gameReducer(removed, { type: 'ADD_ALERT', payload: alert });

    expect(readded.alerts).toHaveLength(0);
    expect(readded).toBe(removed);
  });

  it('clears dismissed ids when the level changes', () => {
    const state = {
      alerts: [],
      dismissedAlertIds: ['write-access-l6'],
      completedTaskIds: {},
      zoxideData: {},
    } as unknown as GameState;

    const next = gameReducer(state, {
      type: 'SET_LEVEL',
      index: 5,
      fs: { id: 'root', name: 'root', type: 'dir', children: [] },
      path: ['root'],
    });

    expect(next.dismissedAlertIds).toEqual([]);
  });
});

describe('gameReducer SET_LEVEL timer', () => {
  it('re-arms the watchdog timer from the level definition on restart', () => {
    const state = {
      timeLeft: 0,
      completedTaskIds: {},
      zoxideData: {},
    } as unknown as GameState;

    const next = gameReducer(state, {
      type: 'SET_LEVEL',
      index: 5,
      fs: { id: 'root', name: 'root', type: 'dir', children: [] },
      path: ['root'],
    });

    expect(LEVELS[5].timeLimit).toBe(90);
    expect(next.timeLeft).toBe(90);
  });
});

describe('gameReducer action flag sanitization', () => {
  const dirtyState = {
    usedG: true,
    usedPreviewDown: true,
    usedPreviewUp: true,
    usedDown: true,
    usedUp: true,
    cursorIndex: 0,
    currentPath: ['root', 'home', 'guest'],
    levelIndex: 0,
    fs: { id: 'root', name: 'root', type: 'dir' as const, children: [] },
    levelStartFS: { id: 'root', name: 'root', type: 'dir' as const, children: [] },
    levelStartPath: ['root', 'home', 'guest'],
    loadedDirIds: ['dir-a'],
  } as unknown as GameState;

  it('resets all action tracking flags on RESTART_CYCLE to prevent cross-cycle leakage', () => {
    const next = gameReducer(dirtyState, { type: 'RESTART_CYCLE' });
    expect(next.usedG).toBe(false);
    expect(next.usedPreviewDown).toBe(false);
    expect(next.usedPreviewUp).toBe(false);
    expect(next.usedDown).toBe(false);
    expect(next.usedUp).toBe(false);
    expect(next.loadedDirIds).toEqual([]);
  });

  it('resets all action tracking flags on RESET_LEVEL', () => {
    const next = gameReducer(dirtyState, { type: 'RESET_LEVEL' });
    expect(next.usedG).toBe(false);
    expect(next.usedPreviewDown).toBe(false);
    expect(next.usedPreviewUp).toBe(false);
    expect(next.usedDown).toBe(false);
    expect(next.usedUp).toBe(false);
    expect(next.loadedDirIds).toEqual([]);
  });

  it('resets preview scroll flags when cursor index changes (scoping preview to active file)', () => {
    const stateWithPreview = {
      ...dirtyState,
      cursorIndex: 1,
      usedPreviewDown: true,
      usedPreviewUp: true,
    };
    const next = gameReducer(stateWithPreview, { type: 'SET_CURSOR', index: 2 });
    expect(next.cursorIndex).toBe(2);
    expect(next.usedPreviewDown).toBe(false);
    expect(next.usedPreviewUp).toBe(false);
  });

  it('retains preview scroll flags when cursor index does not change', () => {
    const stateWithPreview = {
      ...dirtyState,
      cursorIndex: 1,
      usedPreviewDown: true,
      usedPreviewUp: true,
    };
    const next = gameReducer(stateWithPreview, { type: 'SET_CURSOR', index: 1 });
    expect(next.cursorIndex).toBe(1);
    expect(next.usedPreviewDown).toBe(true);
    expect(next.usedPreviewUp).toBe(true);
  });
});

describe('gameReducer LOAD_DIRS', () => {
  const state = { loadedDirIds: [] } as unknown as GameState;

  it('adds new ids and ignores ones already loaded', () => {
    const first = gameReducer(state, { type: 'LOAD_DIRS', ids: ['a', 'b'] });
    expect(first.loadedDirIds).toEqual(['a', 'b']);

    const next = gameReducer(first, { type: 'LOAD_DIRS', ids: ['b', 'c'] });
    expect(next.loadedDirIds).toEqual(['a', 'b', 'c']);

    expect(gameReducer(next, { type: 'LOAD_DIRS', ids: ['a'] })).toBe(next);
  });
});

describe('gameReducer NAVIGATE_BACK', () => {
  const clipboard = {
    nodes: [{ id: 'clean-node', name: 'uplink_v1.conf', type: 'file' as const, content: 'CLEAN' }],
    action: 'yank' as const,
    originalPath: ['root', 'home', 'guest', '.config', 'vault', 'active'],
  };

  const state = {
    currentPath: ['root', 'home', 'guest'],
    history: [['root'], ['root', 'home']],
    future: [],
    clipboard,
    cursorIndex: 2,
    usedPreviewDown: true,
    usedPreviewUp: true,
  } as unknown as GameState;

  it('records where H landed and the clipboard it carried', () => {
    const next = gameReducer(state, { type: 'NAVIGATE_BACK' });
    expect(next.currentPath).toEqual(['root', 'home']);
    expect(next.lastHistoryBackPath).toEqual(['root', 'home']);
    expect(next.lastHistoryBackClipboardIds).toEqual(['clean-node']);
  });

  it('records no clipboard ids when the clipboard is empty', () => {
    const next = gameReducer({ ...state, clipboard: null }, { type: 'NAVIGATE_BACK' });
    expect(next.lastHistoryBackClipboardIds).toBeNull();
  });
});
