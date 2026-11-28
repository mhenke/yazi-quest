import { assert, property, boolean, constantFrom, integer, subarray, tuple } from 'fast-check';
import { describe, it } from 'vitest';
import type { FileNode, GameState } from '../../types';
import { LEVELS } from '../../constants/levels';
import { cloneFS, findPathById, getNodeById, getNodeByPath } from '../../utils/fsHelpers';
import { gameReducer, type Action } from '../gameReducer';
import { makeBootState, makeKey, makeNormalContext } from '../../../tests/helpers/keyboardHarness';
import { handleClipboardKeyDown } from './handleClipboard';

const NUM_RUNS = 150;

const collectIds = (root: FileNode): string[] => {
  const ids: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    ids.push(node.id);
    if (node.children) stack.push(...node.children);
  }
  return ids;
};

const validateParentLinks = (root: FileNode): boolean => {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    for (const child of node.children ?? []) {
      if (child.parentId !== node.id) return false;
      stack.push(child);
    }
  }
  return true;
};

const makeFixtureTree = (): FileNode => ({
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'src',
      name: 'src',
      type: 'dir',
      parentId: 'root',
      children: [
        { id: 'f1', name: 'alpha.txt', type: 'file', parentId: 'src' },
        { id: 'f2', name: 'beta.log', type: 'file', parentId: 'src' },
        { id: 'f3', name: '.secret', type: 'file', parentId: 'src' },
        {
          id: 'nested',
          name: 'nested',
          type: 'dir',
          parentId: 'src',
          children: [{ id: 'f4', name: 'inner.txt', type: 'file', parentId: 'nested' }],
        },
      ],
    },
    {
      id: 'dst',
      name: 'dst',
      type: 'dir',
      parentId: 'root',
      children: [
        { id: 'dst-f1', name: 'alpha.txt', type: 'file', parentId: 'dst' },
        { id: 'dst-keep', name: 'keep.txt', type: 'file', parentId: 'dst' },
      ],
    },
  ],
});

const runReducerAction = (initial: GameState, dispatchKey: ReturnType<typeof makeKey>) => {
  let state = initial;
  const notifications: string[] = [];
  const dispatch = (action: Parameters<typeof gameReducer>[1]) => {
    state = gameReducer(state, action);
  };
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  const items = (currentDir?.children ?? []).filter(
    (c) => state.showHidden || !c.name.startsWith('.')
  );
  const handled = handleClipboardKeyDown(
    dispatchKey,
    makeNormalContext(state, dispatch, {
      items,
      currentItem: items[state.cursorIndex] ?? null,
      currentLevel: LEVELS[state.levelIndex],
      showNotification: (msg) => notifications.push(msg),
    })
  );
  return { state, handled, notifications };
};

describe('property: handleClipboardKeyDown invariants', () => {
  it('paste (yank/cut × normal/force) preserves unique IDs, valid parentIds, and input immutability', () => {
    assert(
      property(
        constantFrom('y' as const, 'x' as const),
        boolean(),
        constantFrom('f1', 'f2', 'nested', 'f4'),
        (grabKey, forcePaste, targetId) => {
          const fs = makeFixtureTree();
          const snapshot = JSON.stringify(fs);
          const sourcePath = findPathById(fs, targetId)!.slice(0, -1);
          const sourceDir = getNodeByPath(fs, sourcePath)!;
          const targetIdx = sourceDir.children!.findIndex((c) => c.id === targetId);
          const boot = makeBootState(1, {
            fs,
            currentPath: sourcePath,
            cursorIndex: targetIdx,
            showHidden: true,
          });

          const grabbed = runReducerAction(boot, makeKey({ key: grabKey }));
          if (!grabbed.handled || !grabbed.state.clipboard) return false;

          const moved = { ...grabbed.state, currentPath: ['root', 'dst'], cursorIndex: 0 };
          const pasteKey = forcePaste
            ? makeKey({ key: 'P', shiftKey: true })
            : makeKey({ key: 'p' });
          const pasted = runReducerAction(moved, pasteKey);
          if (!pasted.handled) return false;

          const ids = collectIds(pasted.state.fs);
          const uniqueIds = new Set(ids).size === ids.length;
          return (
            uniqueIds && validateParentLinks(pasted.state.fs) && JSON.stringify(fs) === snapshot
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('refuses pasting any directory into its own subtree across cut/yank and force/normal', () => {
    assert(
      property(
        constantFrom('y' as const, 'x' as const),
        boolean(),
        constantFrom(['root', 'src'], ['root', 'src', 'nested']),
        (grabAction, forcePaste, destPath) => {
          const fs = makeFixtureTree();
          const srcNode = getNodeById(fs, 'src')!;
          const state = makeBootState(1, {
            fs,
            currentPath: [...destPath],
            clipboard: {
              nodes: [srcNode],
              action: grabAction === 'x' ? 'cut' : 'yank',
              originalPath: ['root'],
            },
          });
          const notifications: string[] = [];
          const dispatches: unknown[] = [];
          const key = forcePaste ? makeKey({ key: 'P', shiftKey: true }) : makeKey({ key: 'p' });

          handleClipboardKeyDown(
            key,
            makeNormalContext(state, (a) => dispatches.push(a), {
              items: [],
              currentItem: null,
              currentLevel: LEVELS[0],
              showNotification: (msg) => notifications.push(msg),
            })
          );

          return (
            dispatches.length === 0 && notifications.some((msg) => msg.includes('own subtree'))
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('enforces clipboardPolicy for yank-only and cut-only levels including levelStartFS exemption', () => {
    assert(
      property(
        constantFrom('cut' as const, 'yank' as const),
        boolean(),
        boolean(),
        (policy, isCut, existsAtStart) => {
          const level = { ...LEVELS[0], clipboardPolicy: policy };
          const item: FileNode = { id: 'node-1', name: 'token.pem', type: 'file', parentId: 'd' };
          const startFs: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: existsAtStart ? [item] : [],
          };
          const liveFs: FileNode = { id: 'root', name: 'root', type: 'dir', children: [item] };
          const state = makeBootState(1, {
            fs: liveFs,
            levelStartFS: startFs,
            currentPath: ['root'],
          });
          const actions: Array<{ type: string }> = [];

          handleClipboardKeyDown(
            makeKey({ key: isCut ? 'x' : 'y' }),
            makeNormalContext(state, (a) => actions.push(a), {
              items: [item],
              currentItem: item,
              currentLevel: level,
              showNotification: () => undefined,
            })
          );

          const expectedAllowed = policy === 'cut' ? isCut : !isCut || (isCut && !existsAtStart);
          const didGrab = actions.some((a) => a.type === 'SET_CLIPBOARD');
          return didGrab === expectedAllowed;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('Ctrl+A selects visible items and Ctrl+R is an involution over direct visible children', () => {
    const dirIds = ['f1', 'f2', 'f3', 'nested'];
    assert(
      property(subarray(dirIds), boolean(), (initialSelected, showHidden) => {
        const fs = makeFixtureTree();
        const srcDir = getNodeById(fs, 'src')!;
        const visibleItems = srcDir.children!.filter((c) => showHidden || !c.name.startsWith('.'));
        const visibleIds = visibleItems.map((c) => c.id);

        const base = makeBootState(1, {
          fs,
          currentPath: ['root', 'src'],
          selectedIds: initialSelected,
          showHidden,
        });

        const afterSelectAll = runReducerAction(base, makeKey({ key: 'a', ctrlKey: true }));
        if (afterSelectAll.state.selectedIds.join(',') !== visibleIds.join(',')) return false;

        const firstInvert = runReducerAction(base, makeKey({ key: 'r', ctrlKey: true }));
        const expectedFirst = visibleIds.filter((id) => !initialSelected.includes(id));
        if (firstInvert.state.selectedIds.join(',') !== expectedFirst.join(',')) return false;

        const secondInvert = runReducerAction(
          firstInvert.state,
          makeKey({ key: 'r', ctrlKey: true })
        );
        const expectedRestored = visibleIds.filter((id) => initialSelected.includes(id));
        return secondInvert.state.selectedIds.join(',') === expectedRestored.join(',');
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('rename respects levelStartFS identity for protected nodes and blocks multi-selection rename', () => {
    assert(
      property(
        boolean(),
        boolean(),
        boolean(),
        integer({ min: 0, max: 2 }),
        (isProtectedNode, matchesStartName, isMultiSelect, freshMode) => {
          const currentName = matchesStartName ? 'core' : 'core_1';
          const nodeId = freshMode === 0 ? 'fresh-id' : 'core-id';
          const item: FileNode = {
            id: nodeId,
            name: currentName,
            type: 'dir',
            protected: isProtectedNode,
            parentId: 'root',
          };
          const startNode: FileNode = { ...item, id: 'core-id', name: 'core' };
          const fs: FileNode = { id: 'root', name: 'root', type: 'dir', children: [item] };
          const startFs: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: [startNode],
          };

          const state = makeBootState(1, {
            fs: cloneFS(fs),
            levelStartFS: startFs,
            currentPath: ['root'],
            selectedIds: isMultiSelect ? [nodeId, 'other'] : [],
          });
          const res = runReducerAction(state, makeKey({ key: 'r' }));

          if (isMultiSelect) {
            return res.state.mode === 'normal';
          }
          const canonicalMatch = isProtectedNode && nodeId === 'core-id' && matchesStartName;
          return canonicalMatch
            ? res.state.mode === 'normal'
            : res.state.mode === 'rename' && res.state.inputBuffer === currentName;
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('trash delete (d) blocks Levels 9 and 14 while permanent delete (D) always queues selection', () => {
    assert(
      property(
        tuple(integer({ min: 0, max: LEVELS.length - 1 }), boolean()),
        ([levelIdx, permanent]) => {
          const level = LEVELS[levelIdx];
          const item: FileNode = { id: 'item-1', name: 'log.txt', type: 'file', parentId: 'root' };
          const state = makeBootState(level.id, {
            fs: { id: 'root', name: 'root', type: 'dir', children: [item] },
            currentPath: ['root'],
          });
          const actions: Action[] = [];
          const notifications: string[] = [];

          handleClipboardKeyDown(
            makeKey({ key: permanent ? 'D' : 'd', shiftKey: permanent }),
            makeNormalContext(state, (a) => actions.push(a), {
              items: [item],
              currentItem: item,
              currentLevel: level,
              showNotification: (msg) => notifications.push(msg),
            })
          );

          const trashBlocked = !permanent && (level.id === 9 || level.id === 14);
          if (trashBlocked) {
            return (
              actions.length === 0 &&
              notifications.some((msg) => msg.includes('TRASH DELETE BLOCKED'))
            );
          }
          return actions.some(
            (a) =>
              a.type === 'SET_DELETE_PENDING' &&
              a.deleteType === (permanent ? 'permanent' : 'trash')
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
