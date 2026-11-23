import {
  assert,
  array,
  boolean,
  constantFrom,
  integer,
  nat,
  property,
  record,
  stringMatching,
} from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { FileNode, GameState, SortBy, SortDirection } from '../types';
import { gameReducer, type Action } from './gameReducer';
import { createInitialState } from './initialState';
import {
  deleteNode,
  getAllDirectoriesWithPaths,
  getNodeById,
  getNodeByPath,
} from '../utils/fsHelpers';
import { getVisibleItems } from '../utils/viewHelpers';

const stepArb = record({
  kind: constantFrom(
    'move',
    'navigate',
    'back',
    'forward',
    'set-cursor',
    'toggle-hidden',
    'set-filter',
    'clear-filter',
    'search',
    'confirm-search',
    'sort',
    'select',
    'toggle-select',
    'load-dirs',
    'mode',
    'info-panel',
    'modal',
    'keystrokes'
  ),
  delta: integer({ min: -20, max: 20 }),
  index: integer({ min: -100000, max: 100000 }),
  pathIndex: nat(1000),
  filter: stringMatching(/^[a-z.]{0,5}$/),
  sortBy: constantFrom('natural', 'alphabetical', 'modified', 'size', 'extension'),
  direction: constantFrom('asc', 'desc'),
  mode: constantFrom('normal', 'help', 'input-file'),
  flag: boolean(),
});

type Step = {
  kind: string;
  delta: number;
  index: number;
  pathIndex: number;
  filter: string;
  sortBy: SortBy;
  direction: SortDirection;
  mode: GameState['mode'];
  flag: boolean;
};

const navigationAction = (step: Step, paths: string[][], visible: FileNode[]): Action | null => {
  switch (step.kind) {
    case 'move':
      return { type: 'MOVE_CURSOR', delta: step.delta, itemCount: visible.length };
    case 'set-cursor':
      return { type: 'SET_CURSOR', index: step.index };
    case 'navigate':
      return { type: 'NAVIGATE', path: paths[step.pathIndex % paths.length] };
    case 'back':
      return { type: 'NAVIGATE_BACK' };
    case 'forward':
      return { type: 'NAVIGATE_FORWARD' };
    default:
      return null;
  }
};

const listAction = (step: Step, dirId: string, dirChildren: FileNode[]): Action | null => {
  switch (step.kind) {
    case 'toggle-hidden':
      return { type: 'TOGGLE_HIDDEN' };
    case 'set-filter':
      return { type: 'SET_FILTER', dirId, filter: step.filter };
    case 'clear-filter':
      return { type: 'CLEAR_FILTER', dirId };
    case 'search':
      return { type: 'SET_SEARCH', query: step.filter || 'a', results: dirChildren };
    case 'confirm-search':
      return { type: 'CONFIRM_SEARCH', query: step.filter || 'a', results: dirChildren };
    case 'sort':
      return { type: 'SET_SORT', sortBy: step.sortBy, direction: step.direction };
    default:
      return null;
  }
};

const selectionAction = (step: Step, ids: string[], visible: FileNode[]): Action => {
  switch (step.kind) {
    case 'select':
      return { type: 'SET_SELECTION', ids: [ids[step.pathIndex % ids.length]] };
    case 'toggle-select':
      return {
        type: 'TOGGLE_SELECTION',
        id: ids[step.pathIndex % ids.length],
        itemCount: visible.length,
      };
    case 'load-dirs':
      return { type: 'LOAD_DIRS', ids: [ids[step.pathIndex % ids.length]] };
    case 'mode':
      return { type: 'SET_MODE', mode: step.mode };
    case 'info-panel':
      return { type: 'TOGGLE_INFO_PANEL' };
    case 'modal':
      return { type: 'SET_MODAL_VISIBILITY', modal: 'help', visible: step.flag };
    default:
      return { type: 'INCREMENT_KEYSTROKES', weighted: step.flag };
  }
};

const actionFor = (step: Step, state: GameState, paths: string[][], ids: string[]): Action => {
  const visible = getVisibleItems(state);
  const nav = navigationAction(step, paths, visible);
  if (nav) return nav;

  const dir = getNodeByPath(state.fs, state.currentPath);
  const list = listAction(step, dir?.id ?? 'root', dir?.children ?? []);
  return list ?? selectionAction(step, ids, visible);
};

const nodeIds = (fs: FileNode): string[] => {
  const ids: string[] = [];
  const stack = [fs];
  while (stack.length) {
    const node = stack.pop()!;
    ids.push(node.id);
    if (node.children) stack.push(...node.children);
  }
  return ids;
};

describe('property: reducer keeps list and navigation state coherent', () => {
  it('cursor stays in bounds and paths/selections stay resolvable', () => {
    const initial = createInitialState();
    const dirs = getAllDirectoriesWithPaths(initial.fs);
    const paths = dirs.map((d) => d.path);
    const ids = nodeIds(initial.fs);
    const fsSnapshot = JSON.stringify(initial.fs);

    assert(
      property(array(stepArb, { maxLength: 30 }), (steps) => {
        let state = initial;

        for (const step of steps as Step[]) {
          state = gameReducer(state, actionFor(step, state, paths, ids));

          const visible = getVisibleItems(state);
          const lastIndex = Math.max(0, visible.length - 1);

          expect(state.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(state.cursorIndex).toBeLessThanOrEqual(lastIndex);
          expect(getNodeByPath(state.fs, state.currentPath)).toBeDefined();

          for (const id of state.selectedIds) {
            expect(getNodeById(state.fs, id)).toBeDefined();
          }
          if (!state.showHidden) {
            expect(visible.some((item) => item.name.startsWith('.'))).toBe(false);
          }
        }

        expect(JSON.stringify(state.fs)).toBe(fsSnapshot);
      }),
      { numRuns: 100 }
    );
  });

  it('clamps the cursor when DELETE_NODES shrinks the visible list', () => {
    const initial = createInitialState();
    const visible = getVisibleItems(initial);
    expect(visible.length).toBeGreaterThan(0);

    assert(
      property(
        integer({ min: 0, max: visible.length - 1 }),
        integer({ min: 0, max: visible.length - 1 }),
        (cursorIndex, targetIndex) => {
          const cursorState =
            initial.cursorIndex === cursorIndex
              ? initial
              : gameReducer(initial, { type: 'SET_CURSOR', index: cursorIndex });

          const deleted = deleteNode(initial.fs, initial.currentPath, visible[targetIndex].id);
          expect(deleted.ok).toBe(true);
          if (!deleted.ok) return;

          const next = gameReducer(cursorState, { type: 'DELETE_NODES', newFs: deleted.value });
          const remaining = getVisibleItems(next);

          expect(next.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(next.cursorIndex).toBeLessThanOrEqual(Math.max(0, remaining.length - 1));

          const cursorId = visible[cursorIndex].id;
          const expectedId =
            visible[targetIndex].id === cursorId
              ? (visible[cursorIndex + 1]?.id ?? visible[cursorIndex - 1]?.id)
              : cursorId;
          if (remaining.length > 0) {
            expect(remaining[next.cursorIndex]?.id).toBe(expectedId);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('keeps the same node when earlier items go, else moves to the next survivor', () => {
    const initial = createInitialState();
    const visible = getVisibleItems(initial);
    expect(visible.length).toBeGreaterThanOrEqual(4);

    const deleteVisible = (state: GameState, nodes: FileNode[]): GameState => {
      let fs = state.fs;
      for (const node of nodes) {
        const result = deleteNode(fs, state.currentPath, node.id);
        expect(result.ok).toBe(true);
        if (result.ok) fs = result.value;
      }
      return gameReducer(state, { type: 'DELETE_NODES', newFs: fs });
    };

    const atThird = gameReducer(initial, { type: 'SET_CURSOR', index: 2 });

    const earlierGone = deleteVisible(atThird, [visible[0], visible[1]]);
    expect(getVisibleItems(earlierGone)[earlierGone.cursorIndex].id).toBe(visible[2].id);

    const cursorAndEarlierGone = deleteVisible(atThird, [visible[0], visible[2]]);
    expect(getVisibleItems(cursorAndEarlierGone)[cursorAndEarlierGone.cursorIndex].id).toBe(
      visible[3].id
    );

    const allGone = deleteVisible(atThird, visible);
    expect(getVisibleItems(allGone)).toEqual([]);
    expect(allGone.cursorIndex).toBe(0);
  });
});

describe('property: SET_CURSOR clamps arbitrary indices into the visible list', () => {
  it('any index, negative or huge, leaves the cursor in bounds', () => {
    const initial = createInitialState();
    const dirs = getAllDirectoriesWithPaths(initial.fs);
    const paths = dirs.map((d) => d.path);

    assert(
      property(
        array(stepArb, { maxLength: 10 }),
        integer({ min: -1_000_000, max: 1_000_000 }),
        (steps, index) => {
          let state = initial;
          for (const step of steps as Step[]) {
            state = gameReducer(state, actionFor(step, state, paths, nodeIds(initial.fs)));
          }
          const next = gameReducer(state, { type: 'SET_CURSOR', index });
          const visible = getVisibleItems(next);
          expect(next.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(next.cursorIndex).toBeLessThanOrEqual(Math.max(0, visible.length - 1));

          // In-place preview reset: jumping to a different row clears the flags,
          // staying put keeps them.
          const moved = next.cursorIndex !== state.cursorIndex;
          expect(next.usedPreviewDown).toBe(moved ? false : state.usedPreviewDown);
          expect(next.usedPreviewUp).toBe(moved ? false : state.usedPreviewUp);

          // An in-bounds request must be honoured exactly.
          const lastIndex = Math.max(0, getVisibleItems(state).length - 1);
          if (index >= 0 && index <= lastIndex) expect(next.cursorIndex).toBe(index);
        }
      ),
      { numRuns: 150 }
    );
  });
});

describe('property: PASTE keeps the current path resolvable', () => {
  it('re-anchors to the deepest surviving ancestor when newFs lost the directory', () => {
    const initial = createInitialState();
    const dirs = getAllDirectoriesWithPaths(initial.fs);
    const paths = dirs.map((d) => d.path);

    assert(
      property(
        nat(paths.length - 1),
        integer({ min: -1000, max: 1000 }),
        boolean(),
        (pathPick, cursorIndex, cut) => {
          const currentPath = paths[pathPick];
          // newFs: the directory at currentPath removed from its parent, so the
          // tree no longer resolves the cwd the PASTE lands in.
          const removal = deleteNode(
            initial.fs,
            currentPath.slice(0, -1),
            currentPath[currentPath.length - 1]
          );
          if (!removal.ok) return; // root itself cannot be removed from its parent

          const state: GameState = { ...initial, currentPath, cursorIndex };
          const next = gameReducer(state, {
            type: 'PASTE',
            newFs: removal.value,
            action: cut ? 'cut' : 'yank',
          });

          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
          expect(next.currentPath.length).toBeLessThan(currentPath.length);

          const visible = getVisibleItems(next);
          expect(next.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(next.cursorIndex).toBeLessThanOrEqual(Math.max(0, visible.length - 1));
          // Clipboard behavior unchanged: cut clears, yank keeps.
          expect(next.clipboard).toBe(cut ? null : initial.clipboard);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('leaves an intact current directory untouched when pasting', () => {
    const initial = createInitialState();
    const dirs = getAllDirectoriesWithPaths(initial.fs);
    const paths = dirs.map((d) => d.path);

    assert(
      property(nat(paths.length - 1), nat(50), (pathPick, cursorIndex) => {
        const currentPath = paths[pathPick];
        const next = gameReducer(
          { ...initial, currentPath, cursorIndex },
          { type: 'PASTE', newFs: initial.fs, action: 'yank' }
        );

        expect(next.currentPath).toEqual(currentPath);
        expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();

        const lastIndex = Math.max(0, getVisibleItems(next).length - 1);
        expect(next.cursorIndex).toBe(Math.min(cursorIndex, lastIndex));
      }),
      { numRuns: 150 }
    );
  });

  it('root is the worst-case fallback when the whole tree under it is gone', () => {
    const initial = createInitialState();
    const emptied = { ...initial.fs, children: [] } as FileNode;
    const next = gameReducer(initial, { type: 'PASTE', newFs: emptied, action: 'yank' });

    expect(next.currentPath).toEqual([next.fs.id]);
    expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
    expect(getVisibleItems(next)).toEqual([]);
    expect(next.cursorIndex).toBe(0);
  });
});
