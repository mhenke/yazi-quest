import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../constants/levels';
import type { FileNode } from '../../types';
import { getNodeById } from '../../utils/fsHelpers';
import { createInitialState } from '../initialState';
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
    const gameState = {
      ...createInitialState(),
      fs,
      currentPath: ['root', 'tmp'],
      pendingDeleteIds: ['target'],
    };
    const actions: Action[] = [];

    handleConfirmDeleteModeKeyDown(
      { key } as KeyboardEvent,
      (action) => actions.push(action),
      gameState,
      [target],
      LEVELS[0]
    );

    const deletion = actions.find((action) => action.type === 'DELETE_NODES');
    expect(deletion?.type).toBe('DELETE_NODES');
    if (deletion?.type === 'DELETE_NODES') {
      expect(getNodeById(deletion.newFs, 'target')).toBeUndefined();
    }
  });
});
