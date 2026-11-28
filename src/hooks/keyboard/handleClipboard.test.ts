import { describe, expect, it, vi } from 'vitest';
import type { FileNode, GameState } from '../../types';
import { LEVELS } from '../../constants/levels';
import { cloneFS, deleteNode, getNodeById, getNodeByPath } from '../../utils/fsHelpers';
import { makeBootState, makeKey, makeNormalContext } from '../../../tests/helpers/keyboardHarness';
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
): GameState => makeBootState(1, { fs, currentPath, clipboard });

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
    const showNotification = vi.fn();

    const handled = handleClipboardKeyDown(
      makeKey({ key: 'P', shiftKey: true }),
      makeNormalContext(state, dispatch, {
        items: nested.children!,
        currentItem: nested.children![0],
        currentLevel: LEVELS[0],
        showNotification,
      })
    );

    expect(handled).toBe(true);
    expect(dispatch.mock.calls.some(([action]) => action.type === 'PASTE')).toBe(false);
    expect(
      showNotification.mock.calls.some(([message]) => String(message).includes('own subtree'))
    ).toBe(true);
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
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: nested.children!,
        currentItem: nested.children![0],
        currentLevel: LEVELS[0],
      })
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
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, { items: [], currentItem: null, currentLevel: LEVELS[0] })
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
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, { items: [], currentItem: null, currentLevel: LEVELS[0] })
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
      makeKey({ key: 'P', shiftKey: true }),
      makeNormalContext(state, dispatch, { items: [], currentItem: null, currentLevel: LEVELS[0] })
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
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, { items: [], currentItem: null, currentLevel: LEVELS[0] })
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
      makeKey({ key: 'P', shiftKey: true }),
      makeNormalContext(state, dispatch, { items: [], currentItem: null, currentLevel: LEVELS[0] })
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
    let state = makeBootState(1, {
      fs,
      currentPath: ['root', 'training'],
      selectedIds: ['v2', 'payload'],
      clipboard: null,
    });
    const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
      state = gameReducer(state, action);
    };

    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(state, dispatch, {
        items: [payload],
        currentItem: payload,
        currentLevel: LEVELS[0],
      })
    );
    dispatch({ type: 'NAVIGATE', path: ['root', 'active'] });
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [v2],
        currentItem: v2,
        currentLevel: LEVELS[0],
      })
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
    const showNotification = vi.fn();
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [],
        currentItem: null,
        currentLevel: LEVELS[0],
        showNotification,
      })
    );
    expect(dispatch.mock.calls.some(([action]) => action.type === 'PASTE')).toBe(false);
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('NotFound'), 4000);
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
      makeKey({ key: 'P', shiftKey: true }),
      makeNormalContext(state, dispatch, {
        items: [source],
        currentItem: source,
        currentLevel: LEVELS[0],
      })
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
    const state = makeBootState(1, { fs, currentPath: ['root'] });
    const dispatch = vi.fn();

    expect(
      handleClipboardKeyDown(
        makeKey({ key: ' ' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
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
        makeKey({ key: 'a' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'input-file' });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'a', ctrlKey: true }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SELECTION', ids: ['a', 'b'] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'MARK_ACTION_USED', actionId: 'CtrlA' });
  });

  it('inverts selection on Ctrl+r and handles rename vs batch rename on r', () => {
    const items = makeItems();
    const fs = dir('root', 'root', items);
    const state = makeBootState(1, {
      fs,
      currentPath: ['root'],
      selectedIds: ['a'],
      showHidden: false,
    });
    const dispatch = vi.fn();

    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'r', ctrlKey: true }),
        makeNormalContext(state, dispatch, {
          items: items.slice(0, 2),
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SELECTION', ids: ['b'] });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'r' }),
        makeNormalContext({ ...state, selectedIds: ['a', 'b'] }, dispatch, {
          items: items.slice(0, 2),
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_NOTIFICATION',
      message: 'Batch rename not available in this version',
    });

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'r' }),
        makeNormalContext({ ...state, selectedIds: [] }, dispatch, {
          items: items.slice(0, 2),
          currentItem: items[0],
          currentLevel: LEVELS[0],
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'rename' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_INPUT_BUFFER', buffer: 'alpha.txt' });
  });

  it('handles yank, cut, clipboardPolicy blocks, and Shift+Y clear', () => {
    const items = makeItems().slice(0, 2);
    const fs = dir('root', 'root', items);
    const state = makeBootState(1, { fs, currentPath: ['root'] });
    const dispatch = vi.fn();
    const showNotification = vi.fn();

    const cutOnlyLevel = { ...LEVELS[0], clipboardPolicy: 'cut' as const };
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'y' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: cutOnlyLevel,
          showNotification,
        })
      )
    ).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      expect.stringContaining('Yank (y) blocked'),
      4000
    );

    const yankOnlyLevel = { ...LEVELS[0], clipboardPolicy: 'yank' as const };
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'x' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: yankOnlyLevel,
          showNotification,
        })
      )
    ).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('Cut (x) blocked'), 4000);

    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'y' }),
        makeNormalContext({ ...state, selectedIds: ['a'] }, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
          showNotification,
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_CLIPBOARD', action: 'yank' })
    );

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'Y', shiftKey: true }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
          showNotification,
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_CLIPBOARD' });
  });

  it('allows cutting a misplaced pasted copy (and repeating) under clipboardPolicy: yank while still blocking cut on levelStartFS files', () => {
    const token = file('fs-new-key', 'access_key_new.pem');
    const sourceCreds = dir('creds', 'credentials', [token]);
    const wrongDir = dir('systemd-core', 'systemd-core');
    const targetCreds = dir('target-creds', 'credentials');
    const otherWrongDir = dir('staging', 'staging');
    const fs = dir('root', 'root', [sourceCreds, wrongDir, targetCreds, otherWrongDir]);
    const level10 = LEVELS.find((l) => l.id === 10)!;

    let state = makeBootState(10, { fs, currentPath: ['root', 'creds'] });
    const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
      state = gameReducer(state, action);
    };
    const showNotification = vi.fn();

    // Original levelStartFS token cannot be cut on a yank-only level
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(state, dispatch, {
        items: [token],
        currentItem: token,
        currentLevel: level10,
        showNotification,
      })
    );
    expect(state.clipboard).toBeNull();
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('Cut (x) blocked'), 4000);

    // Yank original token and accidentally paste into systemd-core
    handleClipboardKeyDown(
      makeKey({ key: 'y' }),
      makeNormalContext(state, dispatch, {
        items: [token],
        currentItem: token,
        currentLevel: level10,
      })
    );
    expect(state.clipboard?.action).toBe('yank');

    dispatch({ type: 'NAVIGATE', path: ['root', 'systemd-core'] });
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [],
        currentItem: null,
        currentLevel: level10,
      })
    );

    const pastedOnce = getNodeByPath(state.fs, ['root', 'systemd-core'])?.children?.find(
      (n) => n.name === 'access_key_new.pem'
    );
    expect(pastedOnce).toBeDefined();
    expect(pastedOnce?.id).not.toBe('fs-new-key');

    // Cut misplaced copy and paste into a second wrong directory (staging)
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(state, dispatch, {
        items: [pastedOnce!],
        currentItem: pastedOnce!,
        currentLevel: level10,
        showNotification,
      })
    );
    expect(state.clipboard?.action).toBe('cut');
    expect(showNotification).not.toHaveBeenCalledWith(
      expect.stringContaining('Cut (x) blocked'),
      4000
    );

    dispatch({ type: 'NAVIGATE', path: ['root', 'staging'] });
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [],
        currentItem: null,
        currentLevel: level10,
      })
    );
    expect(getNodeByPath(state.fs, ['root', 'systemd-core'])?.children).toEqual([]);
    const pastedTwice = getNodeByPath(state.fs, ['root', 'staging'])?.children?.find(
      (n) => n.name === 'access_key_new.pem'
    );
    expect(pastedTwice?.id).toBe(pastedOnce?.id);

    // Can still cut a second time and move into the intended credentials dir
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(state, dispatch, {
        items: [pastedTwice!],
        currentItem: pastedTwice!,
        currentLevel: level10,
      })
    );
    expect(state.clipboard?.action).toBe('cut');

    dispatch({ type: 'NAVIGATE', path: ['root', 'target-creds'] });
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [],
        currentItem: null,
        currentLevel: level10,
      })
    );
    expect(getNodeByPath(state.fs, ['root', 'staging'])?.children).toEqual([]);
    expect(getNodeByPath(state.fs, ['root', 'target-creds'])?.children?.map((n) => n.name)).toEqual(
      ['access_key_new.pem']
    );
    expect(getNodeByPath(state.fs, ['root', 'creds'])?.children?.map((n) => n.name)).toEqual([
      'access_key_new.pem',
    ]);
  });

  it('blocks mixed original + pasted multi-selection and checks descendants for directories on yank levels', () => {
    const origFile = file('orig-1', 'orig.txt');
    const fsAtStart = dir('root', 'root', [origFile]);
    const pastedFile = file('fresh-1', 'copy.txt');
    const cleanNewDir = dir('fresh-dir-clean', 'clean-dir', [pastedFile]);
    const taintedNewDir = dir('fresh-dir-tainted', 'tainted-dir', [origFile]);
    const currentFs = dir('root', 'root', [origFile, pastedFile, cleanNewDir, taintedNewDir]);
    const yankLevel = { ...LEVELS[0], clipboardPolicy: 'yank' as const };
    const dispatch = vi.fn();
    const showNotification = vi.fn();

    // Mixed selection (original + pasted) must block cut
    const mixedState = makeBootState(1, {
      fs: currentFs,
      levelStartFS: fsAtStart,
      currentPath: ['root'],
      selectedIds: ['orig-1', 'fresh-1'],
    });
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(mixedState, dispatch, {
        items: currentFs.children!,
        currentItem: pastedFile,
        currentLevel: yankLevel,
        showNotification,
      })
    );
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_CLIPBOARD' }));
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('Cut (x) blocked'), 4000);

    // Newly created dir containing an original descendant must block cut
    dispatch.mockClear();
    showNotification.mockClear();
    const taintedDirState = makeBootState(1, {
      fs: currentFs,
      levelStartFS: fsAtStart,
      currentPath: ['root'],
    });
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(taintedDirState, dispatch, {
        items: currentFs.children!,
        currentItem: taintedNewDir,
        currentLevel: yankLevel,
        showNotification,
      })
    );
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_CLIPBOARD' }));
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('Cut (x) blocked'), 4000);

    // Newly created dir containing only newly pasted descendants is allowed to be cut
    dispatch.mockClear();
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(taintedDirState, dispatch, {
        items: currentFs.children!,
        currentItem: cleanNewDir,
        currentLevel: yankLevel,
        showNotification,
      })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_CLIPBOARD', action: 'cut' })
    );
  });

  it('handles d/D delete queueing, level 14 trash block, empty selection, and unhandled keys', () => {
    const items = makeItems().slice(0, 2);
    const fs = dir('root', 'root', items);
    const state = makeBootState(1, { fs, currentPath: ['root'] });
    const dispatch = vi.fn();
    const showNotification = vi.fn();

    const level14 = LEVELS.find((l) => l.id === 14) ?? { ...LEVELS[0], id: 14 };
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'd' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: level14,
          showNotification,
        })
      )
    ).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      expect.stringContaining('TRASH DELETE BLOCKED'),
      4000
    );

    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'd' }),
        makeNormalContext(state, dispatch, {
          items: [],
          currentItem: null,
          currentLevel: LEVELS[0],
          showNotification,
        })
      )
    ).toBe(true);
    expect(showNotification).toHaveBeenCalledWith('Nothing to delete', 4000);

    dispatch.mockClear();
    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'D' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
          showNotification,
        })
      )
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_DELETE_PENDING',
      ids: ['a'],
      deleteType: 'permanent',
    });

    expect(
      handleClipboardKeyDown(
        makeKey({ key: 'z' }),
        makeNormalContext(state, dispatch, {
          items,
          currentItem: items[0],
          currentLevel: LEVELS[0],
          showNotification,
        })
      )
    ).toBe(false);
  });

  it('allows renaming a conflict-renamed or yank-pasted protected node (Level 12 p + delete + rename recovery) while blocking untouched protected nodes', () => {
    const level12 = LEVELS.find((l) => l.id === 12)!;
    const wsCore: FileNode = {
      id: 'systemd-core',
      name: 'systemd-core',
      type: 'dir',
      protected: true,
      parentId: 'workspace',
      children: [file('main-rs', 'main.rs')],
    };
    const stockDaemonCore: FileNode = {
      id: 'daemons-systemd-core',
      name: 'systemd-core',
      type: 'dir',
      parentId: 'daemons',
      children: [file('dm-model', 'model.rs')],
    };
    const workspace = dir('workspace', 'workspace', [wsCore]);
    const daemons = dir('daemons', 'daemons', [stockDaemonCore]);
    const fs = dir('root', 'root', [workspace, daemons]);

    let state = makeBootState(12, { fs, currentPath: ['root', 'workspace'] });
    const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
      state = gameReducer(state, action);
    };
    const showNotification = vi.fn();

    // 1. Untouched workspace/systemd-core (matches levelStartFS id + name) cannot be renamed.
    handleClipboardKeyDown(
      makeKey({ key: 'r' }),
      makeNormalContext(state, dispatch, {
        items: [wsCore],
        currentItem: wsCore,
        currentLevel: level12,
        showNotification,
      })
    );
    expect(state.mode).toBe('normal');
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('immutable'), 4000);

    // 2. Cut workspace/systemd-core and plain-paste ('p') into /daemons -> creates systemd-core_1.
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'x' }),
      makeNormalContext(state, dispatch, {
        items: [wsCore],
        currentItem: wsCore,
        currentLevel: level12,
        showNotification,
      })
    );
    dispatch({ type: 'NAVIGATE', path: ['root', 'daemons'] });
    handleClipboardKeyDown(
      makeKey({ key: 'p' }),
      makeNormalContext(state, dispatch, {
        items: [stockDaemonCore],
        currentItem: stockDaemonCore,
        currentLevel: level12,
        showNotification,
      })
    );

    const daemonsChildren = getNodeByPath(state.fs, ['root', 'daemons'])?.children ?? [];
    const pastedConflict = daemonsChildren.find((n) => n.name === 'systemd-core_1');
    expect(pastedConflict?.id).toBe('systemd-core');
    expect(pastedConflict?.protected).toBe(true);

    // 3. Delete stock /daemons/systemd-core, then press 'r' on systemd-core_1 -> allowed.
    const deleteRes = deleteNode(state.fs, ['root', 'daemons'], 'daemons-systemd-core', 11);
    expect(deleteRes.ok).toBe(true);
    if (!deleteRes.ok) return;
    dispatch({ type: 'DELETE_NODES', newFs: deleteRes.value });
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'r' }),
      makeNormalContext(state, dispatch, {
        items: [pastedConflict!],
        currentItem: pastedConflict!,
        currentLevel: level12,
        showNotification,
      })
    );
    expect(state.mode).toBe('rename');
    expect(state.inputBuffer).toBe('systemd-core_1');

    const renameTo = (newName: string) => {
      const newFs = cloneFS(state.fs);
      const node = getNodeById(newFs, 'systemd-core')!;
      node.name = newName;
      dispatch({ type: 'RENAME_NODE', oldId: 'systemd-core', newNode: node, newFs });
      dispatch({ type: 'SET_MODE', mode: 'normal' });
    };

    // 4. Typo recovery: rename to 'system-core' -> 'r' still allowed until canonical name is restored.
    renameTo('system-core');
    const typoNode = getNodeByPath(state.fs, ['root', 'daemons'])?.children?.find(
      (n) => n.id === 'systemd-core'
    );
    expect(typoNode?.name).toBe('system-core');
    handleClipboardKeyDown(
      makeKey({ key: 'r' }),
      makeNormalContext(state, dispatch, {
        items: [typoNode!],
        currentItem: typoNode!,
        currentLevel: level12,
        showNotification,
      })
    );
    expect(state.mode).toBe('rename');
    expect(state.inputBuffer).toBe('system-core');

    // 5. Restoring canonical 'systemd-core' re-engages immutability against casual rename.
    renameTo('systemd-core');
    const restoredNode = getNodeByPath(state.fs, ['root', 'daemons'])?.children?.find(
      (n) => n.id === 'systemd-core'
    );
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'r' }),
      makeNormalContext(state, dispatch, {
        items: [restoredNode!],
        currentItem: restoredNode!,
        currentLevel: level12,
        showNotification,
      })
    );
    expect(state.mode).toBe('normal');
    expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('immutable'), 4000);

    // 6. A freshly yank-pasted protected copy (id absent from levelStartFS) is also renamable.
    const yankedProtected: FileNode = {
      id: 'fresh-yank-copy',
      name: 'systemd-core',
      type: 'dir',
      protected: true,
      parentId: 'daemons',
      children: [],
    };
    showNotification.mockClear();
    handleClipboardKeyDown(
      makeKey({ key: 'r' }),
      makeNormalContext(state, dispatch, {
        items: [yankedProtected],
        currentItem: yankedProtected,
        currentLevel: level12,
        showNotification,
      })
    );
    expect(state.mode).toBe('rename');
    expect(state.inputBuffer).toBe('systemd-core');
  });
});
