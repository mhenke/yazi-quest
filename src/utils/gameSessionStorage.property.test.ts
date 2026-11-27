// @vitest-environment jsdom
import { assert, boolean, constantFrom, integer, property, stringMatching } from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../hooks/initialState';
import { addNode, getNodeById } from './fsHelpers';
import { loadGameSession, resetGameSession, saveGameSession } from './gameSessionStorage';

describe('active level recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGameSession();
  });

  it('preserves the filesystem, task progress, settings and challenge counters', () => {
    const initial = createInitialState();
    assert(
      property(
        stringMatching(/^[a-z]{1,12}$/),
        integer({ min: 0, max: 300 }),
        integer({ min: 0, max: 100 }),
        boolean(),
        constantFrom('full' as const, 'reduced' as const, 'minimal' as const),
        (name, timeLeft, keystrokes, soundEnabled, narrativeEffects) => {
          const node = { id: `test-${name}`, name: `${name}.txt`, type: 'file' as const };
          const result = addNode(initial.fs, initial.currentPath, node);
          expect(result.ok).toBe(true);
          if (!result.ok) return;
          const state = {
            ...initial,
            fs: result.value,
            completedTaskIds: { ...initial.completedTaskIds, 1: ['calibrate-sensors'] },
            timeLeft,
            keystrokes,
            settings: { soundEnabled, narrativeEffects },
            mode: 'input-file' as const,
            inputBuffer: 'unfinished',
          };
          expect(saveGameSession(state)).toBe(true);
          const restored = loadGameSession(initial);
          expect(restored).not.toBeNull();
          expect(getNodeById(restored!.fs, node.id)).toEqual(node);
          expect(restored!.completedTaskIds[1]).toEqual(['calibrate-sensors']);
          expect(restored!.timeLeft).toBe(timeLeft);
          expect(restored!.keystrokes).toBe(keystrokes);
          expect(restored!.settings).toEqual(state.settings);
          expect(restored!.mode).toBe('normal');
          expect(restored!.inputBuffer).toBe('');
        }
      ),
      { numRuns: 30 }
    );
  });

  it('preserves an unreadable session instead of overwriting it', () => {
    const initial = createInitialState();
    const broken = '{"version":1,"state":{"fs":null}}';
    localStorage.setItem('yazi-quest-session-v1', broken);
    expect(loadGameSession(initial)).toBeNull();
    expect(saveGameSession(initial)).toBe(false);
    expect(localStorage.getItem('yazi-quest-session-v1')).toBe(broken);
  });

  it('preserves malformed session data instead of resuming or replacing it', () => {
    const initial = createInitialState();
    const invalidStates = [
      { ...initial, fs: { ...initial.fs, id: 42 } },
      { ...initial, fs: { ...initial.fs, protected: 'yes' } },
      { ...initial, currentPath: ['missing'] },
      { ...initial, unlockedLevelIndex: -1 },
      { ...initial, completedTaskIds: { 1: [null] } },
      { ...initial, clipboard: { action: 'cut', originalPath: [], nodes: 42 } },
    ];
    assert(
      property(constantFrom(...invalidStates), (state) => {
        resetGameSession();
        const raw = JSON.stringify({ version: 1, state });
        localStorage.setItem('yazi-quest-session-v1', raw);
        expect(loadGameSession(initial)).toBeNull();
        expect(saveGameSession(initial)).toBe(false);
        expect(localStorage.getItem('yazi-quest-session-v1')).toBe(raw);
      })
    );
  });
});
