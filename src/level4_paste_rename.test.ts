import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cloneFS, addNode, findNodeByName } from '../utils/fsHelpers';
import { INITIAL_FS, LEVELS } from '../constants';
import { simulateCompletionOfLevel } from '../utils/seedLevels';
import { GameState } from '../types';

describe('Level 4: paste and rename task checks', () => {
  const level = LEVELS.find((l) => l.id === 4)!;
  const dupTask = () => level.tasks.find((t) => t.id === 'duplicate-v1')!;
  const renameTask = () => level.tasks.find((t) => t.id === 'rename-v2')!;
  const prevTask = () => level.tasks.find((t) => t.id === 'enter-and-create-v1')!;

  let originalCompleted: boolean[];

  beforeEach(() => {
    // Snapshot and reset task completion flags so checks rely on explicit control
    originalCompleted = level.tasks.map((t) => t.completed);
    level.tasks.forEach((t) => (t.completed = false));
    // Mark the prerequisite "enter-and-create-v1" as completed for tests that need it
    prevTask().completed = true;
  });

  afterEach(() => {
    level.tasks.forEach((t, i) => (t.completed = originalCompleted[i]));
  });

  it('create (CREATE_FILE) should NOT satisfy duplicate-v1 (requires PASTE)', () => {
    // Build a FS with protocols/ + uplink_v1.conf but WITHOUT uplink_v2.conf
    let fs = cloneFS(INITIAL_FS);
    const datastorePath = ['root', 'home', 'guest', 'datastore'];
    const addProt = addNode(fs, datastorePath, {
      id: 'prot-test',
      name: 'protocols',
      type: 'dir',
      children: [],
    } as any);
    if (addProt.ok) fs = addProt.value;
    const protNode = findNodeByName(fs, 'protocols');
    if (protNode) {
      const protPath = ['root', 'home', 'guest', 'datastore', protNode.id];
      const addV1 = addNode(fs, protPath, {
        id: 'v1-test',
        name: 'uplink_v1.conf',
        type: 'file',
        content: 'network_mode=passive',
      } as any);
      if (addV1.ok) fs = addV1.value;
    }

    const state = {
      fs,
      currentPath: ['root', 'home', 'guest', 'datastore'],
      lastAction: { type: 'CREATE_FILE', timestamp: Date.now() },
      clipboard: null,
    } as unknown as GameState;

    const checkFn = dupTask().check as (s: GameState, l: any) => boolean;
    expect(checkFn(state, level)).toBe(false);
  });

  it('navigation (JUMP_BOTTOM) should NOT satisfy duplicate-v1', () => {
    // Build a FS with protocols/ + uplink_v1.conf but WITHOUT uplink_v2.conf
    let fs = cloneFS(INITIAL_FS);
    const datastorePath = ['root', 'home', 'guest', 'datastore'];
    const addProt = addNode(fs, datastorePath, {
      id: 'prot-test-2',
      name: 'protocols',
      type: 'dir',
      children: [],
    } as any);
    if (addProt.ok) fs = addProt.value;
    const protNode = findNodeByName(fs, 'protocols');
    if (protNode) {
      const protPath = ['root', 'home', 'guest', 'datastore', protNode.id];
      const addV1 = addNode(fs, protPath, {
        id: 'v1-test-2',
        name: 'uplink_v1.conf',
        type: 'file',
        content: 'network_mode=passive',
      } as any);
      if (addV1.ok) fs = addV1.value;
    }

    const state = {
      fs,
      currentPath: ['root', 'home', 'guest', 'datastore'],
      lastAction: { type: 'JUMP_BOTTOM', timestamp: Date.now() },
      clipboard: null,
    } as unknown as GameState;

    const checkFn = dupTask().check as (s: GameState, l: any) => boolean;
    expect(checkFn(state, level)).toBe(false);
  });

  it('y (YANK) then p (PASTE) sequence should satisfy duplicate-v1', () => {
    const fs = simulateCompletionOfLevel(cloneFS(INITIAL_FS), 4);
    const state = {
      fs,
      currentPath: ['root', 'home', 'guest', 'datastore', 'protocols'],
      lastAction: { type: 'PASTE', timestamp: Date.now() },
      clipboard: {
        nodes: [],
        action: 'yank',
        originalPath: ['root', 'home', 'guest', 'datastore'],
      },
    } as unknown as GameState;

    const checkFn = dupTask().check as (s: GameState, l: any) => boolean;
    expect(checkFn(state, level)).toBe(true);
  });

  it("rename (RENAME) should satisfy rename-v2 when file exists as 'uplink_v2.conf'", () => {
    const fs = simulateCompletionOfLevel(cloneFS(INITIAL_FS), 4);

    // Ensure duplicate task is considered completed as precondition for rename-v2
    level.tasks.find((t) => t.id === 'duplicate-v1')!.completed = true;

    const state = {
      fs,
      currentPath: ['root', 'home', 'guest', 'datastore', 'protocols'],
      lastAction: { type: 'RENAME', timestamp: Date.now(), data: { newName: 'uplink_v2.conf' } },
      clipboard: null,
    } as unknown as GameState;

    const checkFn = renameTask().check as (s: GameState, l: any) => boolean;
    expect(checkFn(state, level)).toBe(true);
  });
});
