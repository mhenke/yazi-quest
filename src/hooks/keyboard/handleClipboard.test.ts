import { describe, expect, it, vi } from 'vitest';
import type { FileNode, GameState } from '../../types';
import { LEVELS } from '../../constants/levels';
import { createInitialState } from '../initialState';
import { getNodeByPath } from '../../utils/fsHelpers';
import { handleClipboardKeyDown } from './handleClipboard';

const file = (id: string, name: string): FileNode => ({ id, name, type: 'file' });
const dir = (id: string, name: string, children: FileNode[] = []): FileNode => ({
  id,
  name,
  type: 'dir',
  children,
});

const stateWith = (
  fs: FileNode,
  currentPath: string[],
  clipboard: NonNullable<GameState['clipboard']>
): GameState => ({
  ...createInitialState(),
  fs,
  currentPath,
  clipboard,
  levelIndex: 0,
});

describe('paste into the pasted node subtree', () => {
  it('refuses a force-cut directory pasted into its own subtree', () => {
    const nested = dir('D', 'D', [file('f', 'f.txt')]);
    const fs = dir('root', 'root', [nested]);
    const state = stateWith(fs, ['root', 'D'], {
      nodes: [nested],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();
    const notify = vi.fn();

    const handled = handleClipboardKeyDown(
      { key: 'P', shiftKey: true } as KeyboardEvent,
      state,
      dispatch,
      nested.children!,
      nested.children![0],
      LEVELS[0],
      notify
    );

    expect(handled).toBe(true);
    expect(dispatch.mock.calls.some(([action]) => action.type === 'PASTE')).toBe(false);
    expect(notify.mock.calls.some(([message]) => String(message).includes('own subtree'))).toBe(
      true
    );
  });

  it('refuses yanking a directory into its own subtree', () => {
    const nested = dir('D', 'D', [file('f', 'f.txt')]);
    const fs = dir('root', 'root', [nested]);
    const state = stateWith(fs, ['root', 'D'], {
      nodes: [nested],
      action: 'yank',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    handleClipboardKeyDown(
      { key: 'p', shiftKey: false } as KeyboardEvent,
      state,
      dispatch,
      nested.children!,
      nested.children![0],
      LEVELS[0],
      vi.fn()
    );

    expect(dispatch.mock.calls.some(([action]) => action.type === 'PASTE')).toBe(false);
  });

  it('still pastes into a different directory', () => {
    const target = dir('D', 'D');
    const source = file('a', 'a.txt');
    const fs = dir('root', 'root', [target, source]);
    const state = stateWith(fs, ['root', 'D'], {
      nodes: [source],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    const handled = handleClipboardKeyDown(
      { key: 'p', shiftKey: false } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      vi.fn()
    );

    expect(handled).toBe(true);
    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste).toBeDefined();
    if (paste?.type === 'PASTE') {
      expect(getNodeByPath(paste.newFs, ['root', 'D'])?.children?.map((c) => c.name)).toContain(
        'a.txt'
      );
    }
  });
});
