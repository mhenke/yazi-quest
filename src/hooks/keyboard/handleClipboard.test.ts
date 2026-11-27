import { describe, expect, it, vi } from 'vitest';
import type { FileNode, GameState } from '../../types';
import { LEVELS } from '../../constants/levels';
import { createInitialState } from '../initialState';
import { getNodeByPath } from '../../utils/fsHelpers';
import { gameReducer } from '../gameReducer';
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

const allIds = (fs: FileNode): string[] => {
  const ids: string[] = [];
  const stack = [fs];
  while (stack.length) {
    const node = stack.pop()!;
    ids.push(node.id);
    if (node.children) stack.push(...node.children);
  }
  return ids;
};

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

  it('regenerates ids for a pasted directory subtree', () => {
    const source = dir('src', 'src', [file('a', 'a.txt'), dir('sub', 'sub', [file('b', 'b.txt')])]);
    const fs = dir('root', 'root', [source, dir('target', 'target')]);
    const state = stateWith(fs, ['root', 'target'], {
      nodes: [source],
      action: 'yank',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    handleClipboardKeyDown(
      { key: 'p', shiftKey: false } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      vi.fn()
    );

    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste).toBeDefined();
    if (paste?.type !== 'PASTE') return;

    const ids: string[] = [];
    const stack = [paste.newFs];
    while (stack.length) {
      const node = stack.pop()!;
      ids.push(node.id);
      if (node.children) stack.push(...node.children);
    }
    expect(new Set(ids).size).toBe(ids.length);

    const copy = getNodeByPath(paste.newFs, ['root', 'target'])?.children?.find(
      (c) => c.name === 'src'
    );
    expect(copy).toBeDefined();
    expect(copy?.id).not.toBe('src');
    expect(copy?.parentId).toBe('target');
    const sub = copy?.children?.find((c) => c.name === 'sub');
    expect(sub?.id).not.toBe('sub');
    expect(sub?.parentId).toBe(copy?.id);
    expect(sub?.children?.[0].parentId).toBe(sub?.id);
  });

  it('regenerates ids for a forced directory paste', () => {
    const source = dir('src', 'src', [file('a', 'a.txt')]);
    const fs = dir('root', 'root', [source, dir('target', 'target')]);
    const state = stateWith(fs, ['root', 'target'], {
      nodes: [source],
      action: 'yank',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    handleClipboardKeyDown(
      { key: 'P', shiftKey: true } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      vi.fn()
    );

    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste).toBeDefined();
    if (paste?.type !== 'PASTE') return;

    const copy = getNodeByPath(paste.newFs, ['root', 'target'])?.children?.find(
      (c) => c.name === 'src'
    );
    expect(copy?.id).not.toBe('src');
    expect(copy?.children?.[0].id).not.toBe('a');
    expect(copy?.children?.[0].parentId).toBe(copy?.id);
  });

  it('preserves a cut directory root id so level checks can match the source', () => {
    const source = dir('src', 'src', [file('a', 'a.txt')]);
    const fs = dir('root', 'root', [source, dir('target', 'target')]);
    const state = stateWith(fs, ['root', 'target'], {
      nodes: [source],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    handleClipboardKeyDown(
      { key: 'p', shiftKey: false } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      vi.fn()
    );

    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste).toBeDefined();
    if (paste?.type !== 'PASTE') return;

    expect(paste.newFs.children?.some((c: FileNode) => c.id === 'src')).toBe(false);
    const copy = getNodeByPath(paste.newFs, ['root', 'target'])?.children?.find(
      (c: FileNode) => c.name === 'src'
    );
    expect(copy?.id).toBe('src');
    expect(copy?.children?.[0].id).not.toBe('a');
    expect(copy?.children?.[0].parentId).toBe('src');
    const ids = allIds(paste.newFs);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves the cut root id on a forced overwrite paste', () => {
    const source = dir('src', 'src', [file('a', 'a.txt')]);
    const fs = dir('root', 'root', [source, dir('target', 'target')]);
    const state = stateWith(fs, ['root', 'target'], {
      nodes: [source],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();

    handleClipboardKeyDown(
      { key: 'P', shiftKey: true } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      vi.fn()
    );

    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste).toBeDefined();
    if (paste?.type !== 'PASTE') return;

    expect(paste.newFs.children?.some((c: FileNode) => c.id === 'src')).toBe(false);
    const copy = getNodeByPath(paste.newFs, ['root', 'target'])?.children?.find(
      (c: FileNode) => c.name === 'src'
    );
    expect(copy?.id).toBe('src');
    const ids = allIds(paste.newFs);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('moves a cross-directory selection without duplicating an existing destination node', () => {
    const v2 = file('v2', 'uplink_active.conf');
    const payload = file('payload', 'exfil_04.log');
    const fs = dir('root', 'root', [
      dir('active', 'active', [v2]),
      dir('training', 'training', [payload]),
    ]);
    let state: GameState = {
      ...createInitialState(),
      fs,
      currentPath: ['root', 'training'],
      selectedIds: ['v2', 'payload'],
      clipboard: null,
    };
    const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
      state = gameReducer(state, action);
    };

    handleClipboardKeyDown(
      { key: 'x' } as KeyboardEvent,
      state,
      dispatch,
      [payload],
      payload,
      LEVELS[0],
      vi.fn()
    );
    dispatch({ type: 'NAVIGATE', path: ['root', 'active'] });
    handleClipboardKeyDown(
      { key: 'p' } as KeyboardEvent,
      state,
      dispatch,
      [v2],
      v2,
      LEVELS[0],
      vi.fn()
    );

    expect(getNodeByPath(state.fs, ['root', 'training'])?.children).toEqual([]);
    expect(
      getNodeByPath(state.fs, ['root', 'active'])
        ?.children?.map((n) => n.name)
        .sort()
    ).toEqual(['exfil_04.log', 'uplink_active.conf']);
    const ids = allIds(state.fs);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not paste a cut node whose source no longer exists', () => {
    const missing = file('missing', 'missing.txt');
    const state = stateWith(dir('root', 'root', [dir('target', 'target')]), ['root', 'target'], {
      nodes: [missing],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();
    const notify = vi.fn();
    handleClipboardKeyDown(
      { key: 'p' } as KeyboardEvent,
      state,
      dispatch,
      [],
      null,
      LEVELS[0],
      notify
    );
    expect(dispatch.mock.calls.some(([action]) => action.type === 'PASTE')).toBe(false);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('NotFound'), 4000);
  });

  it('keeps a cut file when force-pasting it back into its own directory', () => {
    const source = file('a', 'a.txt');
    const state = stateWith(dir('root', 'root', [source]), ['root'], {
      nodes: [source],
      action: 'cut',
      originalPath: ['root'],
    });
    const dispatch = vi.fn();
    handleClipboardKeyDown(
      { key: 'P', shiftKey: true } as KeyboardEvent,
      state,
      dispatch,
      [source],
      source,
      LEVELS[0],
      vi.fn()
    );
    const paste = dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'PASTE');
    expect(paste?.newFs.children).toEqual([expect.objectContaining({ id: 'a', name: 'a.txt' })]);
  });
});

describe('handleClipboardKeyDown selection, rename, yank/cut, and delete branches', () => {
  const makeItems = () => [file('a', 'alpha.txt'), file('b', 'beta.txt'), file('h', '.hidden')];

  it('toggles selection on Space and enters input-file or selects all on a / Ctrl+a', () => {
    const items = makeItems().slice(0, 2);
    const fs = dir('root', 'root', items);
    const state = { ...createInitialState(), fs, currentPath: ['root'], levelIndex: 0 };
    const dispatch = vi.fn();
    const notify = vi.fn();

    expect(
      handleClipboardKeyDown(
        { key: ' ' } as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_SELECTION',
      id: 'a',
      itemCount: 2,
    });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'a', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'input-file' });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'a', ctrlKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SELECTION', ids: ['a', 'b'] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'MARK_ACTION_USED', actionId: 'CtrlA' });
  });

  it('inverts selection on Ctrl+r and handles rename vs batch rename on r', () => {
    const items = makeItems();
    const fs = dir('root', 'root', items);
    const state = {
      ...createInitialState(),
      fs,
      currentPath: ['root'],
      selectedIds: ['a'],
      showHidden: false,
      levelIndex: 0,
    };
    const dispatch = vi.fn();
    const notify = vi.fn();

    expect(
      handleClipboardKeyDown(
        { key: 'r', ctrlKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items.slice(0, 2),
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SELECTION', ids: ['b'] });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'r', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        { ...state, selectedIds: ['a', 'b'] },
        dispatch,
        items.slice(0, 2),
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_NOTIFICATION',
      message: 'Batch rename not available in this version',
    });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'r', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        { ...state, selectedIds: [] },
        dispatch,
        items.slice(0, 2),
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'rename' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_INPUT_BUFFER', buffer: 'alpha.txt' });
  });

  it('handles yank, cut, clipboardPolicy blocks, and Shift+Y clear', () => {
    const items = makeItems().slice(0, 2);
    const fs = dir('root', 'root', items);
    const state = { ...createInitialState(), fs, currentPath: ['root'], levelIndex: 0 };
    const dispatch = vi.fn();
    const notify = vi.fn();

    const cutOnlyLevel = { ...LEVELS[0], clipboardPolicy: 'cut' as const };
    expect(
      handleClipboardKeyDown(
        { key: 'y' } as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        cutOnlyLevel,
        notify
      )
    ).toBe(true);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('Yank (y) blocked'), 4000);

    const yankOnlyLevel = { ...LEVELS[0], clipboardPolicy: 'yank' as const };
    expect(
      handleClipboardKeyDown(
        { key: 'x' } as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        yankOnlyLevel,
        notify
      )
    ).toBe(true);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('Cut (x) blocked'), 4000);

    expect(
      handleClipboardKeyDown(
        { key: 'y' } as KeyboardEvent,
        { ...state, selectedIds: ['a'] },
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_CLIPBOARD', action: 'yank' })
    );

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'Y', shiftKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_CLIPBOARD' });
  });

  it('handles d/D delete queueing, level 14 trash block, empty selection, and unhandled keys', () => {
    const items = makeItems().slice(0, 2);
    const fs = dir('root', 'root', items);
    const state = { ...createInitialState(), fs, currentPath: ['root'], levelIndex: 0 };
    const dispatch = vi.fn();
    const notify = vi.fn();

    const level14 = LEVELS.find((l) => l.id === 14) ?? { ...LEVELS[0], id: 14 };
    expect(
      handleClipboardKeyDown(
        { key: 'd', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        level14,
        notify
      )
    ).toBe(true);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('TRASH DELETE BLOCKED'), 4000);

    expect(
      handleClipboardKeyDown(
        { key: 'd', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        [],
        null,
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(notify).toHaveBeenCalledWith('Nothing to delete', 4000);

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        { key: 'D', preventDefault: vi.fn() } as unknown as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_DELETE_PENDING',
      ids: ['a'],
      deleteType: 'permanent',
    });

    expect(
      handleClipboardKeyDown(
        { key: 'z' } as KeyboardEvent,
        state,
        dispatch,
        items,
        items[0],
        LEVELS[0],
        notify
      )
    ).toBe(false);
  });
});
