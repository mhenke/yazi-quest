import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { FileNode } from '../../types';
import { getNodeById } from '../../utils/fsHelpers';
import { makeBootState, makeKey } from '../../../tests/helpers/keyboardHarness';
import type { Action } from '../gameReducer';
import { handleConfirmDeleteModeKeyDown } from './handleDeleteMode';

const target: FileNode = { id: 'target', name: 'remove-me.txt', type: 'file', parentId: 'tmp' };
const fs: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [{ id: 'tmp', name: 'tmp', type: 'dir', children: [target] }],
};

describe('delete confirmation key', () => {
  it.each(['y', 'Y'])('deletes a selected file when pressing %s', (key) => {
    const gameState = makeBootState(1, {
      fs,
      currentPath: ['root', 'tmp'],
      pendingDeleteIds: ['target'],
    });
    const actions: Action[] = [];

    handleConfirmDeleteModeKeyDown(makeKey({ key }), {
      dispatch: (action) => actions.push(action),
      gameState,
      visibleItems: [target],
      currentLevel: LEVELS[0],
    });

    const deletion = actions.find((action) => action.type === 'DELETE_NODES');
    expect(deletion?.type).toBe('DELETE_NODES');
    if (deletion?.type === 'DELETE_NODES') {
      expect(getNodeById(deletion.newFs, 'target')).toBeUndefined();
    }
  });

  it('deletes a selected file from its actual parent after navigating elsewhere', () => {
    const gameState = makeBootState(1, {
      fs,
      currentPath: ['root'],
      pendingDeleteIds: ['target'],
    });
    const actions: Action[] = [];
    handleConfirmDeleteModeKeyDown(makeKey({ key: 'y' }), {
      dispatch: (action) => actions.push(action),
      gameState,
      visibleItems: fs.children ?? [],
      currentLevel: LEVELS[0],
    });
    const deletion = actions.find((action) => action.type === 'DELETE_NODES');
    expect(deletion?.type).toBe('DELETE_NODES');
    if (deletion?.type === 'DELETE_NODES') {
      expect(getNodeById(deletion.newFs, 'target')).toBeUndefined();
    }
  });

  it('detects a selected honeypot outside the current directory', () => {
    const trapped = { ...target, isHoneypot: true };
    const trappedFs = { ...fs, children: [{ ...fs.children![0], children: [trapped] }] };
    const gameState = makeBootState(1, {
      fs: trappedFs,
      currentPath: ['root'],
      pendingDeleteIds: ['target'],
    });
    const actions: Action[] = [];
    handleConfirmDeleteModeKeyDown(makeKey({ key: 'y' }), {
      dispatch: (action) => actions.push(action),
      gameState,
      visibleItems: trappedFs.children ?? [],
      currentLevel: LEVELS[0],
    });
    expect(actions).toContainEqual({ type: 'GAME_OVER', reason: 'honeypot' });
    expect(actions.some((action) => action.type === 'DELETE_NODES')).toBe(false);
  });

  it('blocks deletion of a protected selection outside the current directory', () => {
    const protectedFs = {
      ...fs,
      children: [{ ...fs.children![0], children: [{ ...target, protected: true }] }],
    };
    const gameState = makeBootState(1, {
      fs: protectedFs,
      currentPath: ['root'],
      pendingDeleteIds: ['target'],
    });
    const actions: Action[] = [];
    handleConfirmDeleteModeKeyDown(makeKey({ key: 'y' }), {
      dispatch: (action) => actions.push(action),
      gameState,
      visibleItems: protectedFs.children ?? [],
      currentLevel: LEVELS[0],
    });
    expect(actions.some((action) => action.type === 'DELETE_NODES')).toBe(false);
    expect(
      actions.some(
        (action) => action.type === 'SET_NOTIFICATION' && action.message.includes('PROTECTED')
      )
    ).toBe(true);
  });
});
