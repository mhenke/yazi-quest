import {
  assert,
  array,
  boolean,
  constant,
  constantFrom,
  double,
  integer,
  nat,
  oneof,
  option,
  property,
  record,
  string,
  stringMatching,
} from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  FileNode,
  GameAlert,
  GameSettings,
  GameState,
  GameStats,
  Linemode,
  SortBy,
  SortDirection,
  ZoxideEntry,
} from '../types';
import { gameReducer, INITIAL_ACTION_FLAGS, type Action } from './gameReducer';
import { createInitialState } from './initialState';
import { LEVELS } from '../constants/levels';
import { INITIAL_FS, applyFileSystemMutations } from '../constants/filesystem';
import {
  addNodeWithConflictResolution,
  cloneFS,
  deleteNode,
  getAllDirectoriesWithPaths,
  getNodeById,
  getNodeByPath,
} from '../utils/fsHelpers';
import { getRecursiveSearchResults, getVisibleItems } from '../utils/viewHelpers';
import { getLevelStartPath } from '../utils/gameUtils';

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

// ---------------------------------------------------------------------------
// Fs-mutating action sequences: ADD_NODE / RENAME_NODE / DELETE_NODES / PASTE
// built with the same helpers App.tsx and handleClipboard.ts use.
// ---------------------------------------------------------------------------

const MUTATING_NAMES = ['foo', '.env', 'notes.txt', 'readme', 'a.b.c', 'x'];

const fsStepArb = record({
  kind: constantFrom(
    'add',
    'rename',
    'delete',
    'yank',
    'cut',
    'paste',
    'select',
    'enter',
    'up',
    'toggle-hidden',
    'sort'
  ),
  nameIndex: nat(MUTATING_NAMES.length - 1),
  nodeIndex: nat(64),
  asDir: boolean(),
  sortBy: constantFrom('natural', 'alphabetical'),
  direction: constantFrom('asc', 'desc'),
});

type FsStep = {
  kind: string;
  nameIndex: number;
  nodeIndex: number;
  asDir: boolean;
  sortBy: SortBy;
  direction: SortDirection;
};

const pickFrom = <T>(items: T[], index: number): T | undefined =>
  items.length ? items[index % items.length] : undefined;

const duplicateIds = (fs: FileNode): string[] => {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  const stack = [fs];
  while (stack.length) {
    const node = stack.pop()!;
    if (seen.has(node.id)) dupes.add(node.id);
    seen.add(node.id);
    if (node.children) stack.push(...node.children);
  }
  return [...dupes];
};

const typeScore = (node: FileNode): number =>
  node.type === 'dir' ? 0 : node.type === 'archive' ? 1 : 2;

// Independent oracle: the visible list must be exactly the (hidden-filtered)
// children of the resolved directory, natural/alphabetical order, reversed for
// desc. Built from state.fs directly instead of calling getVisibleItems.
const oracleVisible = (state: GameState): FileNode[] => {
  const dir = getNodeByPath(state.fs, state.currentPath);
  if (!dir || !dir.children) return [];
  const items = dir.children.filter((c) => state.showHidden || !c.name.startsWith('.'));
  const compare =
    state.sortBy === 'alphabetical'
      ? (a: FileNode, b: FileNode) => a.name.localeCompare(b.name)
      : (a: FileNode, b: FileNode) => typeScore(a) - typeScore(b) || a.name.localeCompare(b.name);
  const sorted = [...items].sort(compare);
  return state.sortDirection === 'desc' ? sorted.reverse() : sorted;
};

const clipboardSig = (clipboard: GameState['clipboard']): string | null =>
  clipboard
    ? `${clipboard.action}|${clipboard.originalPath.join('/')}|${clipboard.nodes
        .map((n) => n.id)
        .join(',')}`
    : null;

const checkInvariants = (state: GameState, label: string): void => {
  expect(getNodeByPath(state.fs, state.currentPath), `${label}: path resolves`).toBeDefined();

  const visible = getVisibleItems(state);
  expect(state.cursorIndex, `${label}: cursor >= 0`).toBeGreaterThanOrEqual(0);
  expect(state.cursorIndex, `${label}: cursor <= last`).toBeLessThanOrEqual(
    Math.max(0, visible.length - 1)
  );

  for (const id of state.selectedIds) {
    expect(getNodeById(state.fs, id), `${label}: selection ${id} exists`).toBeDefined();
  }

  for (const item of state.searchResults) {
    expect(
      getNodeById(state.fs, item.id),
      `${label}: searchResult ${item.id} exists`
    ).toBeDefined();
  }

  for (const item of visible) {
    expect(getNodeById(state.fs, item.id), `${label}: visible ${item.id} exists`).toBeDefined();
  }

  expect(duplicateIds(state.fs), `${label}: no duplicate ids`).toEqual([]);

  if (!state.showHidden) {
    expect(
      visible.some((item) => item.name.startsWith('.')),
      `${label}: no dot entries`
    ).toBe(false);
  }

  expect(
    visible.map((n) => n.id),
    `${label}: visible == oracle`
  ).toEqual(oracleVisible(state).map((n) => n.id));
};

const KNOWN_GOOD_PATH = ['root', 'home', 'guest'];

describe('property: fs-mutating action sequences keep the tree and list coherent', () => {
  it('ADD/RENAME/DELETE/PASTE sequences leave a resolvable path, in-bounds cursor, live selections, unique ids and the oracle list', () => {
    const initial = createInitialState();

    assert(
      property(array(fsStepArb, { minLength: 20, maxLength: 30 }), (rawSteps) => {
        const steps = rawSteps as FsStep[];
        let state = initial;
        let strayed = 0;

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const label = `step ${i} (${step.kind})`;
          const visible = getVisibleItems(state);
          const target = pickFrom(visible, step.nodeIndex);
          const clipboardBefore = clipboardSig(state.clipboard);

          let next = state;
          if (step.kind === 'add') {
            const name = MUTATING_NAMES[step.nameIndex % MUTATING_NAMES.length];
            const node: FileNode = {
              id: 'pending',
              name,
              type: step.asDir ? 'dir' : 'file',
              content: step.asDir ? undefined : 'payload',
            };
            if (step.asDir) node.children = [];
            const res = addNodeWithConflictResolution(state.fs, state.currentPath, node);
            if (res.ok) {
              next = gameReducer(state, { type: 'ADD_NODE', newNode: node, newFs: res.value });
            }
          } else if (step.kind === 'rename') {
            // Same logic as App.handleRenameConfirm: collision-guard by id, set name.
            const name = MUTATING_NAMES[step.nameIndex % MUTATING_NAMES.length];
            const newFs = cloneFS(state.fs);
            const node = target ? getNodeById(newFs, target.id) : undefined;
            const parent = node ? getNodeById(newFs, node.parentId ?? undefined) : undefined;
            const collision = parent?.children?.some((c) => c.name === name && c.id !== node!.id);
            if (node && !collision) {
              node.name = name;
              next = gameReducer(state, {
                type: 'RENAME_NODE',
                oldId: node.id,
                newNode: node,
                newFs,
              });
            }
          } else if (step.kind === 'delete') {
            const res = target ? deleteNode(state.fs, state.currentPath, target.id) : null;
            if (res?.ok) {
              next = gameReducer(state, { type: 'DELETE_NODES', newFs: res.value });
            }
          } else if (step.kind === 'yank' || step.kind === 'cut') {
            // Conflict resolution now regenerates the whole subtree's ids, so
            // directories are safe to paste without duplicating descendants.
            const node = pickFrom(visible, step.nodeIndex);
            if (node) {
              next = gameReducer(state, {
                type: 'SET_CLIPBOARD',
                nodes: [node],
                action: step.kind === 'cut' ? 'cut' : 'yank',
                originalPath: state.currentPath,
              });
              // App clears the selection right after yank/cut.
              next = gameReducer(next, { type: 'SET_SELECTION', ids: [] });
            }
          } else if (step.kind === 'paste') {
            const clip = state.clipboard;
            if (clip) {
              // Mirrors handleClipboard.applyPasteNodes (non-force): for cut,
              // delete the source first (NotFound tolerated), then add with
              // conflict resolution.
              let newFs = state.fs;
              for (const node of clip.nodes) {
                if (clip.action === 'cut') {
                  const removal = deleteNode(newFs, clip.originalPath, node.id);
                  if (removal.ok) newFs = removal.value;
                }
                const add = addNodeWithConflictResolution(newFs, state.currentPath, node);
                if (add.ok) newFs = add.value;
              }
              next = gameReducer(state, { type: 'PASTE', newFs, action: clip.action });

              if (clip.action === 'cut') {
                expect(next.clipboard, `${label}: cut clipboard cleared`).toBeNull();
              } else {
                expect(clipboardSig(next.clipboard), `${label}: yank clipboard persists`).toBe(
                  clipboardBefore
                );
              }
            }
          } else if (step.kind === 'select') {
            if (target) {
              next = gameReducer(state, {
                type: 'TOGGLE_SELECTION',
                id: target.id,
                itemCount: visible.length,
              });
            }
          } else if (step.kind === 'enter') {
            const dir = pickFrom(
              visible.filter((n) => n.type === 'dir' || n.type === 'archive'),
              step.nodeIndex
            );
            if (dir) {
              next = gameReducer(state, {
                type: 'NAVIGATE',
                path: [...state.currentPath, dir.id],
              });
            }
          } else if (step.kind === 'up') {
            if (state.currentPath.length > 1) {
              next = gameReducer(state, {
                type: 'NAVIGATE',
                path: state.currentPath.slice(0, -1),
              });
            }
          } else if (step.kind === 'toggle-hidden') {
            next = gameReducer(state, { type: 'TOGGLE_HIDDEN' });
          } else if (step.kind === 'sort') {
            next = gameReducer(state, {
              type: 'SET_SORT',
              sortBy: step.sortBy,
              direction: step.direction,
            });
          }

          if (next !== state) {
            // Invariants run on the post-action state before any rescue, so a
            // stray path fails here instead of being silently reset.
            checkInvariants(next, label);
            if (!getNodeByPath(next.fs, next.currentPath)) {
              strayed++;
              next = gameReducer(next, { type: 'NAVIGATE', path: [...KNOWN_GOOD_PATH] });
            }
            state = next;
          }
        }

        expect(strayed, 'sequence never left a resolvable path').toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Interleaved FS mutations + history navigation + filters + search + clipboard
// ---------------------------------------------------------------------------

const INTERLEAVED_FILTERS = ['', 'a', 'e', '.env', '\\.txt$', 'foo', '[invalid'];

const interleavedStepArb = record({
  kind: constantFrom(
    'add',
    'rename',
    'delete',
    'yank',
    'cut',
    'paste',
    'clear-clipboard',
    'enter',
    'up',
    'back',
    'forward',
    'set-filter',
    'clear-filter',
    'clear-all-filters',
    'set-search',
    'clear-search',
    'confirm-search',
    'select',
    'toggle-hidden',
    'sort'
  ),
  nameIndex: nat(MUTATING_NAMES.length - 1),
  filterIndex: nat(INTERLEAVED_FILTERS.length - 1),
  nodeIndex: nat(64),
  asDir: boolean(),
  sortBy: constantFrom<SortBy>('natural', 'alphabetical', 'modified', 'size', 'extension'),
  direction: constantFrom<SortDirection>('asc', 'desc'),
});

type InterleavedStep = {
  kind: string;
  nameIndex: number;
  filterIndex: number;
  nodeIndex: number;
  asDir: boolean;
  sortBy: SortBy;
  direction: SortDirection;
};

const checkInterleavedInvariants = (state: GameState, label: string): void => {
  expect(getNodeByPath(state.fs, state.currentPath), `${label}: path resolves`).toBeDefined();

  const visible = getVisibleItems(state);
  expect(state.cursorIndex, `${label}: cursor >= 0`).toBeGreaterThanOrEqual(0);
  expect(state.cursorIndex, `${label}: cursor <= last`).toBeLessThanOrEqual(
    Math.max(0, visible.length - 1)
  );

  for (const id of state.selectedIds) {
    expect(getNodeById(state.fs, id), `${label}: selection ${id} exists`).toBeDefined();
  }

  for (const item of state.searchResults) {
    expect(
      getNodeById(state.fs, item.id),
      `${label}: searchResult ${item.id} exists`
    ).toBeDefined();
  }

  for (const item of visible) {
    expect(getNodeById(state.fs, item.id), `${label}: visible ${item.id} exists`).toBeDefined();
  }

  expect(duplicateIds(state.fs), `${label}: no duplicate ids`).toEqual([]);

  if (!state.showHidden) {
    expect(
      visible.some((item) => {
        if (item.name.startsWith('.')) return true;
        return item.displayPath
          ? item.displayPath.split('/').some((part) => part.startsWith('.'))
          : false;
      }),
      `${label}: no dot entries when !showHidden`
    ).toBe(false);
  }
};

const applyInterleavedFsStep = (
  state: GameState,
  step: InterleavedStep,
  target: FileNode | undefined,
  label: string
): GameState | null => {
  switch (step.kind) {
    case 'add': {
      const name = MUTATING_NAMES[step.nameIndex % MUTATING_NAMES.length];
      const node: FileNode = {
        id: 'pending',
        name,
        type: step.asDir ? 'dir' : 'file',
        content: step.asDir ? undefined : 'payload',
      };
      if (step.asDir) node.children = [];
      const res = addNodeWithConflictResolution(state.fs, state.currentPath, node);
      return res.ok
        ? gameReducer(state, { type: 'ADD_NODE', newNode: node, newFs: res.value })
        : state;
    }
    case 'rename': {
      const name = MUTATING_NAMES[step.nameIndex % MUTATING_NAMES.length];
      const newFs = cloneFS(state.fs);
      const node = target ? getNodeById(newFs, target.id) : undefined;
      const parent = node ? getNodeById(newFs, node.parentId ?? undefined) : undefined;
      const collision = parent?.children?.some((c) => c.name === name && c.id !== node!.id);
      if (!node || collision) return state;
      node.name = name;
      return gameReducer(state, { type: 'RENAME_NODE', oldId: node.id, newNode: node, newFs });
    }
    case 'delete': {
      const parentPath =
        target?.path && target.path.length > 1 ? target.path.slice(0, -1) : state.currentPath;
      const res = target ? deleteNode(state.fs, parentPath, target.id) : null;
      return res?.ok ? gameReducer(state, { type: 'DELETE_NODES', newFs: res.value }) : state;
    }
    case 'yank':
    case 'cut': {
      if (!target || !getNodeById(state.fs, target.id)) return state;
      const origPath =
        target.path && target.path.length > 1 ? target.path.slice(0, -1) : state.currentPath;
      const copied = gameReducer(state, {
        type: 'SET_CLIPBOARD',
        nodes: [target],
        action: step.kind === 'cut' ? 'cut' : 'yank',
        originalPath: origPath,
      });
      return gameReducer(copied, { type: 'SET_SELECTION', ids: [] });
    }
    case 'clear-clipboard': {
      const next = gameReducer(state, { type: 'CLEAR_CLIPBOARD' });
      expect(next.clipboard).toBeNull();
      return next;
    }
    case 'paste': {
      const clip = state.clipboard;
      if (!clip) return state;
      let newFs = state.fs;
      for (const node of clip.nodes) {
        if (clip.action === 'cut') {
          const removal = deleteNode(newFs, clip.originalPath, node.id);
          if (removal.ok) newFs = removal.value;
        }
        const add = addNodeWithConflictResolution(newFs, state.currentPath, node);
        if (add.ok) newFs = add.value;
      }
      const next = gameReducer(state, { type: 'PASTE', newFs, action: clip.action });
      if (clip.action === 'cut') {
        expect(next.clipboard, `${label}: cut clears clipboard`).toBeNull();
      }
      return next;
    }
    default:
      return null;
  }
};

const applyInterleavedNavStep = (
  state: GameState,
  step: InterleavedStep,
  visible: FileNode[]
): GameState | null => {
  switch (step.kind) {
    case 'enter': {
      const dirs = visible.filter(
        (n) => (n.type === 'dir' || n.type === 'archive') && getNodeById(state.fs, n.id)
      );
      const dir = pickFrom(dirs, step.nodeIndex);
      if (!dir) return state;
      const targetPath =
        dir.path && getNodeByPath(state.fs, dir.path) ? dir.path : [...state.currentPath, dir.id];
      return getNodeByPath(state.fs, targetPath)
        ? gameReducer(state, { type: 'NAVIGATE', path: targetPath })
        : state;
    }
    case 'up':
      return state.currentPath.length > 1
        ? gameReducer(state, { type: 'NAVIGATE', path: state.currentPath.slice(0, -1) })
        : state;
    case 'back':
      return gameReducer(state, { type: 'NAVIGATE_BACK' });
    case 'forward':
      return gameReducer(state, { type: 'NAVIGATE_FORWARD' });
    default:
      return null;
  }
};

const applyInterleavedViewStep = (
  state: GameState,
  step: InterleavedStep,
  visible: FileNode[],
  target: FileNode | undefined
): GameState => {
  const currentDir = getNodeByPath(state.fs, state.currentPath);
  const filterStr = INTERLEAVED_FILTERS[step.filterIndex % INTERLEAVED_FILTERS.length];
  switch (step.kind) {
    case 'set-filter': {
      if (!currentDir) return state;
      const next = gameReducer(state, {
        type: 'SET_FILTER',
        dirId: currentDir.id,
        filter: filterStr,
      });
      expect(next.cursorIndex).toBe(0);
      return next;
    }
    case 'clear-filter': {
      if (!currentDir) return state;
      const next = gameReducer(state, { type: 'CLEAR_FILTER', dirId: currentDir.id });
      expect(next.filters[currentDir.id]).toBeUndefined();
      return next;
    }
    case 'clear-all-filters': {
      const next = gameReducer(state, { type: 'CLEAR_ALL_FILTERS' });
      expect(next.filters).toEqual({});
      return next;
    }
    case 'set-search': {
      const q = filterStr || 'a';
      const results = getRecursiveSearchResults(state.fs, q, state.showHidden, state.currentPath);
      const next = gameReducer(state, { type: 'SET_SEARCH', query: q, results });
      expect(next.cursorIndex).toBe(0);
      return next;
    }
    case 'clear-search': {
      const next = gameReducer(state, { type: 'SET_SEARCH', query: null, results: [] });
      expect(next.searchQuery).toBeNull();
      expect(next.searchResults).toEqual([]);
      expect(next.cursorIndex).toBe(0);
      return next;
    }
    case 'confirm-search': {
      const q = filterStr || 'a';
      const results = getRecursiveSearchResults(state.fs, q, state.showHidden, state.currentPath);
      const next = gameReducer(state, { type: 'CONFIRM_SEARCH', query: q, results });
      expect(next.mode).toBe('normal');
      expect(next.usedSearch).toBe(true);
      expect(next.inputBuffer).toBe('');
      expect(next.cursorIndex).toBe(0);
      return next;
    }
    case 'select':
      return target
        ? gameReducer(state, { type: 'TOGGLE_SELECTION', id: target.id, itemCount: visible.length })
        : state;
    case 'toggle-hidden':
      return gameReducer(state, { type: 'TOGGLE_HIDDEN' });
    case 'sort':
      return gameReducer(state, {
        type: 'SET_SORT',
        sortBy: step.sortBy,
        direction: step.direction,
      });
    default:
      return state;
  }
};

describe('property: interleaved FS mutations, history, filters, search, and clipboard', () => {
  it('maintains path, cursor, live selections, unique ids, and hidden-file invariants', () => {
    const initial = createInitialState();

    assert(
      property(array(interleavedStepArb, { minLength: 20, maxLength: 35 }), (rawSteps) => {
        const steps = rawSteps as InterleavedStep[];
        let state = initial;

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const label = `step ${i} (${step.kind})`;
          const visible = getVisibleItems(state);
          const target = pickFrom(visible, step.nodeIndex);
          const next =
            applyInterleavedFsStep(state, step, target, label) ??
            applyInterleavedNavStep(state, step, visible) ??
            applyInterleavedViewStep(state, step, visible, target);

          if (next !== state) {
            checkInterleavedInvariants(next, label);
            state = next;
          }
        }
      }),
      { numRuns: 80 }
    );
  });

  it('NAVIGATE_BACK and NAVIGATE_FORWARD skip deleted directories and clear exhausted stacks', () => {
    const base = createInitialState();
    const validPaths = getAllDirectoriesWithPaths(base.fs).map((d) => d.path);
    const deadPaths = [
      ['root', 'deleted-dir'],
      ['root', 'home', 'deleted-sub'],
      ['root', 'home', 'guest', 'gone-folder'],
    ];
    const entryArb = record({
      alive: boolean(),
      pick: nat(validPaths.length - 1),
    });

    assert(
      property(
        array(entryArb, { minLength: 1, maxLength: 6 }),
        array(entryArb, { minLength: 1, maxLength: 6 }),
        boolean(),
        (historyEntries, futureEntries, hasClipboard) => {
          const toPath = (e: { alive: boolean; pick: number }) =>
            e.alive ? validPaths[e.pick % validPaths.length] : deadPaths[e.pick % deadPaths.length];
          const history = historyEntries.map(toPath);
          const future = futureEntries.map(toPath);
          const clipboard: GameState['clipboard'] = hasClipboard
            ? {
                nodes: [{ id: 'clip-1', name: 'f.txt', type: 'file', content: 'x' }],
                action: 'yank',
                originalPath: base.currentPath,
              }
            : null;

          const state: GameState = { ...base, history, future, clipboard };

          const back = gameReducer(state, { type: 'NAVIGATE_BACK' });
          let expectedBackIdx = -1;
          for (let i = history.length - 1; i >= 0; i--) {
            if (getNodeByPath(state.fs, history[i])) {
              expectedBackIdx = i;
              break;
            }
          }
          expect(getNodeByPath(back.fs, back.currentPath)).toBeDefined();
          if (expectedBackIdx === -1) {
            expect(back.currentPath).toEqual(state.currentPath);
            expect(back.history).toEqual([]);
          } else {
            expect(back.currentPath).toEqual(history[expectedBackIdx]);
            expect(back.history).toEqual(history.slice(0, expectedBackIdx));
            expect(back.future).toEqual([state.currentPath, ...future]);
            expect(back.lastHistoryBackPath).toEqual(history[expectedBackIdx]);
            expect(back.lastHistoryBackClipboardIds).toEqual(hasClipboard ? ['clip-1'] : null);
          }

          const fwd = gameReducer(state, { type: 'NAVIGATE_FORWARD' });
          const expectedFwdIdx = future.findIndex((p) => Boolean(getNodeByPath(state.fs, p)));
          expect(getNodeByPath(fwd.fs, fwd.currentPath)).toBeDefined();
          if (expectedFwdIdx === -1) {
            expect(fwd.currentPath).toEqual(state.currentPath);
            expect(fwd.future).toEqual([]);
          } else {
            expect(fwd.currentPath).toEqual(future[expectedFwdIdx]);
            expect(fwd.future).toEqual(future.slice(expectedFwdIdx + 1));
            expect(fwd.history).toEqual([...history, state.currentPath]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('DELETE_NODES and cut PASTE prune deleted nodes from searchResults and clamp cursor', () => {
    const base = createInitialState();
    const results = getRecursiveSearchResults(base.fs, 'a', false, base.currentPath).filter(
      (n) => n.path && n.path.length > 1
    );
    expect(results.length).toBeGreaterThan(0);

    assert(
      property(
        nat(results.length - 1),
        nat(results.length - 1),
        boolean(),
        (cursorPick, targetPick, viaCutPaste) => {
          const searchState = gameReducer(base, {
            type: 'CONFIRM_SEARCH',
            query: 'a',
            results,
          });
          const positioned = gameReducer(searchState, { type: 'SET_CURSOR', index: cursorPick });
          const target = results[targetPick];
          const parentPath = target.path!.slice(0, -1);
          const deletion = deleteNode(positioned.fs, parentPath, target.id);
          if (!deletion.ok) return;

          let next: GameState;
          if (viaCutPaste) {
            const added = addNodeWithConflictResolution(
              deletion.value,
              positioned.currentPath,
              target
            );
            const newFs = added.ok ? added.value : deletion.value;
            const withClip = gameReducer(positioned, {
              type: 'SET_CLIPBOARD',
              nodes: [target],
              action: 'cut',
              originalPath: parentPath,
            });
            next = gameReducer(withClip, { type: 'PASTE', newFs, action: 'cut' });
          } else {
            next = gameReducer(positioned, { type: 'DELETE_NODES', newFs: deletion.value });
          }

          expect(next.searchResults.some((item) => item.id === target.id)).toBe(false);
          for (const item of next.searchResults) {
            expect(getNodeById(next.fs, item.id)).toBeDefined();
          }
          const visible = getVisibleItems(next);
          for (const item of visible) {
            expect(getNodeById(next.fs, item.id)).toBeDefined();
          }
          expect(next.cursorIndex).toBeGreaterThanOrEqual(0);
          expect(next.cursorIndex).toBeLessThanOrEqual(Math.max(0, visible.length - 1));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// TICK: timer countdown, gauntlet timeout, threat monitor, and game-over logic
// ---------------------------------------------------------------------------

const expectedThreatStatus = (threat: number): string => {
  if (threat < 20) return 'CALM';
  if (threat < 50) return 'ANALYZING';
  if (threat < 80) return 'TRACING';
  return 'BREACH';
};

describe('property: TICK timer, threat monitor, and game-over transitions', () => {
  it('is an exact no-op when isGameOver or showEpisodeIntro is true', () => {
    const initial = createInitialState();

    assert(
      property(
        boolean(),
        boolean(),
        integer({ min: 1, max: 15 }),
        constantFrom(1, 2, 3),
        option(integer({ min: -5, max: 120 }), { nil: null }),
        (isGameOver, showEpisodeIntro, levelId, episodeId, timeLeft) => {
          if (!isGameOver && !showEpisodeIntro) return;
          const state: GameState = { ...initial, isGameOver, showEpisodeIntro, timeLeft };
          const next = gameReducer(state, {
            type: 'TICK',
            currentLevelId: levelId,
            tasks: [{ id: 't1', completed: false }],
            episodeId,
            timeLimit: 60,
            maxKeystrokes: 40,
          });
          expect(next).toBe(state);
        }
      ),
      { numRuns: 80 }
    );
  });

  it('decrements timeLeft, pauses when complete & hidden-off, and triggers game over at 0', () => {
    const initial = createInitialState();

    assert(
      property(
        integer({ min: 1, max: 14 }),
        integer({ min: -5, max: 120 }),
        boolean(),
        boolean(),
        (levelId, timeLeft, allComplete, showHidden) => {
          const tasks = [
            { id: 't1', completed: allComplete },
            { id: 't2', completed: allComplete },
          ];
          const state: GameState = {
            ...initial,
            isGameOver: false,
            showEpisodeIntro: false,
            showHidden,
            timeLeft,
            completedTaskIds: {
              ...initial.completedTaskIds,
              [levelId]: allComplete ? ['t1', 't2'] : ['t1'],
            },
          };

          const next = gameReducer(state, {
            type: 'TICK',
            currentLevelId: levelId,
            tasks,
            episodeId: 1,
            timeLimit: 120,
          });

          if (allComplete && !showHidden) {
            expect(next.timeLeft).toBe(timeLeft);
            expect(next.isGameOver).toBe(false);
          } else if (timeLeft <= 0) {
            expect(next.isGameOver).toBe(true);
            expect(next.gameOverReason).toBe('time');
            expect(next.notification).toBeNull();
          } else {
            expect(next.isGameOver).toBe(false);
            expect(next.timeLeft).toBe(timeLeft - 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles Level 15 gauntlet timeout across phases and score thresholds', () => {
    const initial = createInitialState();
    const tasks = [
      { id: 'gauntlet-1', completed: false },
      { id: 'gauntlet-2', completed: false },
    ];

    assert(
      property(integer({ min: 0, max: 9 }), integer({ min: 0, max: 8 }), (phase, score) => {
        const state: GameState = {
          ...initial,
          isGameOver: false,
          showEpisodeIntro: false,
          showHidden: false,
          timeLeft: 0,
          gauntletPhase: phase,
          gauntletScore: score,
          completedTaskIds: { ...initial.completedTaskIds, [15]: [] },
        };

        const next = gameReducer(state, {
          type: 'TICK',
          currentLevelId: 15,
          tasks,
          episodeId: 3,
        });

        const nextPhase = phase + 1;
        if (nextPhase >= 8) {
          if (score < 6) {
            expect(next.isGameOver).toBe(true);
            expect(next.gameOverReason).toBe('time');
            expect(next.notification?.message).toContain(`${score}/8`);
          } else {
            expect(next.isGameOver).toBe(false);
            expect(next.completedTaskIds[15]).toEqual(['gauntlet-1', 'gauntlet-2']);
            expect(next.notification?.message).toContain(`${score}/8`);
          }
        } else {
          expect(next.isGameOver).toBe(false);
          expect(next.gauntletPhase).toBe(nextPhase);
          expect(next.timeLeft).toBe(20);
          expect(next.notification?.message).toContain('PHASE FAILED');
        }
      }),
      { numRuns: 80 }
    );
  });

  it('keeps threatLevel in [0, 100], matches status buckets, and applies episode pressure rules', () => {
    const initial = createInitialState();

    assert(
      property(
        constantFrom(1, 2, 3),
        double({ min: -20, max: 120, noNaN: true, noDefaultInfinity: true }),
        option(integer({ min: 1, max: 120 }), { nil: null }),
        option(integer({ min: 1, max: 120 }), { nil: undefined }),
        integer({ min: 0, max: 150 }),
        option(integer({ min: 1, max: 100 }), { nil: undefined }),
        boolean(),
        (
          episodeId,
          threatLevel,
          timeLeft,
          timeLimit,
          keystrokes,
          maxKeystrokes,
          triggeredHoneypot
        ) => {
          const state: GameState = {
            ...initial,
            isGameOver: false,
            showEpisodeIntro: false,
            threatLevel,
            timeLeft,
            keystrokes,
            level11Flags: { triggeredHoneypot, selectedModern: false, scoutedFiles: [] },
          };

          const next = gameReducer(state, {
            type: 'TICK',
            currentLevelId: episodeId === 3 ? 11 : episodeId === 2 ? 6 : 1,
            tasks: [{ id: 'pending-task', completed: false }],
            episodeId,
            timeLimit,
            maxKeystrokes,
          });

          expect(next.threatLevel).toBeGreaterThanOrEqual(0);
          expect(next.threatLevel).toBeLessThanOrEqual(100);
          expect(next.threatStatus).toBe(expectedThreatStatus(next.threatLevel));

          if (episodeId === 1 && next.timeLeft !== null && timeLimit) {
            const expectedFloor = Math.min(100, Math.max(0, (1 - next.timeLeft / timeLimit) * 100));
            expect(next.threatLevel).toBeGreaterThanOrEqual(expectedFloor - 1e-9);
          }
          if (episodeId === 2 && maxKeystrokes) {
            const expectedFloor = Math.min(100, Math.max(0, (keystrokes / maxKeystrokes) * 100));
            expect(next.threatLevel).toBeGreaterThanOrEqual(expectedFloor - 1e-9);
          }
          if (episodeId === 3 && triggeredHoneypot) {
            expect(next.threatLevel).toBeGreaterThanOrEqual(90);
            expect(next.threatStatus).toBe('BREACH');
          }
        }
      ),
      { numRuns: 120 }
    );
  });
});

// ---------------------------------------------------------------------------
// Level lifecycle: SET_LEVEL, RESET_LEVEL, RESTART_CYCLE, COMPLETE_INTRO,
// ADVANCE_TO_OUTRO
// ---------------------------------------------------------------------------

const buildLevelFixtures = (): { fs: FileNode; startPath: string[]; dirs: string[][] }[] => {
  const completedTaskIds: Record<number, string[]> = {};
  LEVELS.forEach((l) => {
    completedTaskIds[l.id] = [];
  });
  return LEVELS.map((level, idx) => {
    for (let i = 0; i < idx; i++) {
      completedTaskIds[LEVELS[i].id] = LEVELS[i].tasks.map((t) => t.id);
    }
    const fs = applyFileSystemMutations(cloneFS(INITIAL_FS), level.id, {
      completedTaskIds: { ...completedTaskIds },
    } as GameState);
    const startPath = getLevelStartPath(fs, level);
    const dirs = getAllDirectoriesWithPaths(fs).map((d) => d.path);
    return { fs, startPath, dirs };
  });
};

describe('property: level lifecycle (SET_LEVEL, RESET_LEVEL, RESTART_CYCLE, COMPLETE_INTRO, ADVANCE_TO_OUTRO)', () => {
  const fixtures = buildLevelFixtures();

  it('SET_LEVEL resets ephemeral state, clamps cursor to 0, preserves other level completions, and resolves path', () => {
    const base = createInitialState();

    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        nat(100),
        option(boolean(), { nil: undefined }),
        option(record({ message: string({ maxLength: 20 }) }), { nil: undefined }),
        option(record({ text: string({ maxLength: 20 }) }), { nil: undefined }),
        boolean(),
        (levelIdx, pathPick, showIntro, notification, thought, overrideZoxide) => {
          const fixture = fixtures[levelIdx];
          const path = fixture.dirs[pathPick % fixture.dirs.length];
          const otherLevelId = LEVELS[(levelIdx + 1) % LEVELS.length].id;

          const dirty: GameState = {
            ...base,
            cursorIndex: 7,
            history: [['root']],
            future: [['root', 'home']],
            loadedDirIds: ['root', 'home'],
            clipboard: { nodes: [base.fs], action: 'yank', originalPath: ['root'] },
            selectedIds: ['nonexistent-id'],
            alerts: [{ id: 'a1', title: 'T', message: 'M', severity: 'warning', timestamp: 123 }],
            dismissedAlertIds: ['a0'],
            mode: 'filter',
            filters: { guest: 'foo' },
            showHidden: true,
            searchQuery: 'abc',
            searchResults: [base.fs],
            sortBy: 'size',
            sortDirection: 'desc',
            previewScroll: 12,
            keystrokes: 42,
            weightedKeystrokes: 17,
            gauntletPhase: 4,
            gauntletScore: 3,
            isGameOver: true,
            gameOverReason: 'time',
            usedG: true,
            usedSearch: true,
            completedTaskIds: {
              ...base.completedTaskIds,
              [LEVELS[levelIdx].id]: ['stale-task'],
              [otherLevelId]: ['kept-task'],
            },
          };

          const customZoxide: Record<string, ZoxideEntry> = {
            '/custom': { count: 9, lastAccess: 1000 },
          };

          const next = gameReducer(dirty, {
            type: 'SET_LEVEL',
            index: levelIdx,
            fs: fixture.fs,
            path,
            showIntro,
            notification,
            thought,
            zoxideData: overrideZoxide ? customZoxide : undefined,
          });

          expect(next.levelIndex).toBe(levelIdx);
          expect(next.currentPath).toEqual(path);
          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
          expect(next.levelStartFS).toBe(fixture.fs);
          expect(next.levelStartPath).toEqual(path);
          expect(next.cursorIndex).toBe(0);
          expect(next.cursorIndex).toBeLessThanOrEqual(
            Math.max(0, getVisibleItems(next).length - 1)
          );
          expect(next.history).toEqual([]);
          expect(next.future).toEqual([]);
          expect(next.loadedDirIds).toEqual([]);
          expect(next.clipboard).toBeNull();
          expect(next.selectedIds).toEqual([]);
          expect(next.alerts).toEqual([]);
          expect(next.dismissedAlertIds).toEqual([]);
          expect(next.mode).toBe('normal');
          expect(next.showEpisodeIntro).toBe(showIntro ?? false);
          expect(next.notification).toEqual(notification ?? null);
          expect(next.thought).toEqual(thought ?? null);
          expect(next.timeLeft).toBe(LEVELS[levelIdx].timeLimit ?? null);
          expect(next.keystrokes).toBe(0);
          expect(next.weightedKeystrokes).toBe(0);
          expect(next.gauntletPhase).toBe(0);
          expect(next.gauntletScore).toBe(0);
          expect(next.filters).toEqual({});
          expect(next.showHidden).toBe(false);
          expect(next.searchQuery).toBeNull();
          expect(next.searchResults).toEqual([]);
          expect(next.sortBy).toBe('natural');
          expect(next.sortDirection).toBe('asc');
          expect(next.previewScroll).toBe(0);
          expect(next.isGameOver).toBe(false);
          expect(next.gameOverReason).toBeUndefined();
          expect(next.completedTaskIds[LEVELS[levelIdx].id]).toEqual([]);
          expect(next.completedTaskIds[otherLevelId]).toEqual(['kept-task']);
          expect(next.zoxideData).toBe(overrideZoxide ? customZoxide : dirty.zoxideData);
          for (const [k, v] of Object.entries(INITIAL_ACTION_FLAGS)) {
            expect(next[k as keyof typeof INITIAL_ACTION_FLAGS]).toEqual(v);
          }
        }
      ),
      { numRuns: 60 }
    );
  });

  it('RESET_LEVEL restores levelStartFS, levelStartPath, cursor 0, and clears transient selection/clipboard/flags', () => {
    const base = createInitialState();

    assert(
      property(integer({ min: 0, max: LEVELS.length - 1 }), nat(50), (levelIdx, cursor) => {
        const fixture = fixtures[levelIdx];
        const mutatedFs = cloneFS(fixture.fs);
        const dirty: GameState = {
          ...base,
          fs: mutatedFs,
          levelStartFS: fixture.fs,
          levelStartPath: fixture.startPath,
          currentPath: ['root'],
          cursorIndex: cursor,
          loadedDirIds: ['root', 'var'],
          mode: 'rename',
          clipboard: { nodes: [mutatedFs], action: 'cut', originalPath: ['root'] },
          selectedIds: ['id-1', 'id-2'],
          usedD: true,
          usedP: true,
        };

        const next = gameReducer(dirty, { type: 'RESET_LEVEL' });

        expect(next.fs).toBe(fixture.fs);
        expect(next.currentPath).toEqual(fixture.startPath);
        expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
        expect(next.cursorIndex).toBe(0);
        expect(next.loadedDirIds).toEqual([]);
        expect(next.mode).toBe('normal');
        expect(next.clipboard).toBeNull();
        expect(next.selectedIds).toEqual([]);
        expect(next.usedD).toBe(false);
        expect(next.usedP).toBe(false);
      }),
      { numRuns: 60 }
    );
  });

  it('RESTART_CYCLE increments cycleCount, resets dirty ephemeral state, and preserves settings/stats', () => {
    const base = createInitialState();

    assert(
      property(
        option(integer({ min: 1, max: 20 }), { nil: undefined }),
        integer({ min: 0, max: LEVELS.length }),
        integer({ min: 1, max: 25 }),
        (cycleCount, levelIndex, cursorIndex) => {
          const customSettings: GameSettings = { soundEnabled: false, narrativeEffects: 'minimal' };
          const customStats: GameStats = {
            fuzzyJumps: 3,
            fzfFinds: 4,
            filterUsage: 5,
            renames: 6,
            archivesEntered: 7,
          };
          const dirty: GameState = {
            ...base,
            cycleCount,
            levelIndex,
            cursorIndex,
            selectedIds: ['stale-selected-id'],
            history: [['root'], ['root', 'home']],
            future: [['root', 'tmp']],
            clipboard: { nodes: [base.fs], action: 'cut', originalPath: ['root'] },
            mode: 'filter',
            inputBuffer: 'leftover-buffer',
            filters: { guest: 'foo' },
            searchQuery: 'stale-query',
            searchResults: [base.fs],
            showHidden: true,
            sortBy: 'size',
            sortDirection: 'desc',
            pendingDeleteIds: ['pending-1'],
            deleteType: 'permanent',
            pendingOverwriteNode: { id: 'ow', name: 'ow.txt', type: 'file' },
            currentPath: ['root'],
            levelStartPath: ['root'],
            loadedDirIds: ['root'],
            isGameOver: true,
            gameOverReason: 'time',
            threatLevel: 85,
            threatStatus: 'BREACH',
            keystrokes: 42,
            weightedKeystrokes: 19,
            alerts: [{ id: 'a1', title: 'T', message: 'M', severity: 'error', timestamp: 1 }],
            dismissedAlertIds: ['a2'],
            completedTaskIds: { 1: ['t1'], 2: ['t2'] },
            showEpisodeIntro: false,
            isBooting: false,
            settings: customSettings,
            stats: customStats,
            usedG: true,
            usedSearch: true,
          };

          const next = gameReducer(dirty, { type: 'RESTART_CYCLE' });

          expect(next.cycleCount).toBe((cycleCount || 1) + 1);
          expect(next.levelIndex).toBe(0);
          expect(next.fs).not.toBe(dirty.fs);
          expect(next.levelStartFS).not.toBe(next.fs);
          expect(next.levelStartFS).toEqual(next.fs);
          expect(next.currentPath).toEqual(['root', 'home', 'guest']);
          expect(next.levelStartPath).toEqual(['root', 'home', 'guest']);
          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
          expect(next.cursorIndex).toBe(0);
          expect(next.selectedIds).toEqual([]);
          expect(next.history).toEqual([]);
          expect(next.future).toEqual([]);
          expect(next.loadedDirIds).toEqual([]);
          expect(next.clipboard).toBeNull();
          expect(next.mode).toBe('normal');
          expect(next.inputBuffer).toBe('');
          expect(next.filters).toEqual({});
          expect(next.searchQuery).toBeNull();
          expect(next.searchResults).toEqual([]);
          expect(next.showHidden).toBe(false);
          expect(next.sortBy).toBe('natural');
          expect(next.sortDirection).toBe('asc');
          expect(next.pendingDeleteIds).toEqual([]);
          expect(next.deleteType).toBeNull();
          expect(next.pendingOverwriteNode).toBeNull();
          expect(next.isGameOver).toBe(false);
          expect(next.gameOverReason).toBeUndefined();
          expect(next.threatLevel).toBe(0);
          expect(next.threatStatus).toBe('CALM');
          expect(next.keystrokes).toBe(0);
          expect(next.weightedKeystrokes).toBe(0);
          expect(next.alerts).toEqual([]);
          expect(next.dismissedAlertIds).toEqual([]);
          expect(next.timeLeft).toBe(LEVELS[0].timeLimit ?? null);
          expect(next.completedTaskIds).toEqual({});
          expect(next.showEpisodeIntro).toBe(true);
          expect(next.isBooting).toBe(true);
          expect(next.settings).toEqual(customSettings);
          expect(next.stats).toEqual(customStats);
          for (const [k, v] of Object.entries(INITIAL_ACTION_FLAGS)) {
            expect(next[k as keyof typeof INITIAL_ACTION_FLAGS]).toEqual(v);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('COMPLETE_INTRO resets transient state, resolves level start path, and gates boot sequence on Ep 1 natural completion', () => {
    const base = createInitialState();

    assert(
      property(
        integer({ min: 0, max: LEVELS.length - 1 }),
        boolean(),
        option(boolean(), { nil: undefined }),
        (levelIdx, showEpisodeIntro, isSkip) => {
          const fixture = fixtures[levelIdx];
          const dirty: GameState = {
            ...base,
            levelIndex: levelIdx,
            fs: fixture.fs,
            currentPath: ['root'],
            cursorIndex: 4,
            showEpisodeIntro,
            isBooting: true,
            keystrokes: 15,
            weightedKeystrokes: 8,
            searchQuery: 'foo',
            searchResults: [fixture.fs],
            filters: { root: 'x' },
            selectedIds: ['x'],
            mode: 'search',
            usedG: true,
          };

          const next = gameReducer(dirty, { type: 'COMPLETE_INTRO', isSkip });
          const expectedBoot = !(isSkip ?? false) && showEpisodeIntro && levelIdx === 0;

          expect(next.showEpisodeIntro).toBe(false);
          expect(next.isBooting).toBe(expectedBoot);
          expect(next.currentPath).toEqual(fixture.startPath);
          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
          expect(next.cursorIndex).toBe(0);
          expect(next.keystrokes).toBe(0);
          expect(next.weightedKeystrokes).toBe(0);
          expect(next.searchQuery).toBeNull();
          expect(next.searchResults).toEqual([]);
          expect(next.filters).toEqual({});
          expect(next.selectedIds).toEqual([]);
          expect(next.completedTaskIds[LEVELS[levelIdx].id]).toEqual([]);
          expect(next.mode).toBe('normal');
          expect(next.usedG).toBe(false);
        }
      ),
      { numRuns: 60 }
    );
  });

  it('ADVANCE_TO_OUTRO always sets levelIndex to LEVELS.length', () => {
    const base = createInitialState();

    assert(
      property(integer({ min: 0, max: LEVELS.length }), (levelIndex) => {
        const state: GameState = { ...base, levelIndex };
        const next = gameReducer(state, { type: 'ADVANCE_TO_OUTRO' });
        expect(next.levelIndex).toBe(LEVELS.length);
        expect(next.fs).toBe(state.fs);
        expect(next.currentPath).toBe(state.currentPath);
      }),
      { numRuns: 40 }
    );
  });

  it('COMPLETE_INTRO does not crash after ADVANCE_TO_OUTRO when levelIndex === LEVELS.length', () => {
    const base = createInitialState();
    const dirs = getAllDirectoriesWithPaths(base.fs).map((d) => d.path);

    assert(
      property(
        nat(dirs.length - 1),
        boolean(),
        option(boolean(), { nil: undefined }),
        (pathIdx, showEpisodeIntro, isSkip) => {
          const outroState = gameReducer(
            {
              ...base,
              currentPath: dirs[pathIdx],
              showEpisodeIntro,
              usedG: true,
              cursorIndex: 3,
              mode: 'filter',
            },
            { type: 'ADVANCE_TO_OUTRO' }
          );
          expect(outroState.levelIndex).toBe(LEVELS.length);

          const next = gameReducer(outroState, { type: 'COMPLETE_INTRO', isSkip });
          expect(next.levelIndex).toBe(LEVELS.length);
          expect(next.currentPath).toEqual(outroState.currentPath);
          expect(getNodeByPath(next.fs, next.currentPath)).toBeDefined();
          expect(next.showEpisodeIntro).toBe(false);
          expect(next.isBooting).toBe(false);
          expect(next.cursorIndex).toBe(0);
          expect(next.mode).toBe('normal');
          expect(next.usedG).toBe(false);
        }
      ),
      { numRuns: 40 }
    );
  });
});

// ---------------------------------------------------------------------------
// GAME_OVER and COMPLETE_TASK
// ---------------------------------------------------------------------------

describe('property: GAME_OVER and COMPLETE_TASK', () => {
  it('GAME_OVER sets isGameOver, records reason, and clears notification', () => {
    const base = createInitialState();

    assert(
      property(
        constantFrom<GameState['gameOverReason']>(
          'time',
          'keystrokes',
          'honeypot',
          'criticalFile',
          undefined
        ),
        (reason) => {
          const state: GameState = {
            ...base,
            isGameOver: false,
            notification: { message: 'active alert' },
          };
          const next = gameReducer(state, { type: 'GAME_OVER', reason });
          expect(next.isGameOver).toBe(true);
          expect(next.gameOverReason).toBe(reason);
          expect(next.notification).toBeNull();
        }
      ),
      { numRuns: 40 }
    );
  });

  it('COMPLETE_TASK deduplicates ids, is idempotent, and isolates other levels', () => {
    const base = createInitialState();
    const taskIdArb = stringMatching(/^[a-z0-9_-]{1,8}$/);

    assert(
      property(
        integer({ min: 1, max: 15 }),
        array(taskIdArb, { maxLength: 6 }),
        array(taskIdArb, { maxLength: 8 }),
        (levelId, existing, incoming) => {
          const otherLevelId = (levelId % 15) + 1;
          const state: GameState = {
            ...base,
            completedTaskIds: {
              ...base.completedTaskIds,
              [levelId]: [...new Set(existing)],
              [otherLevelId]: ['preserved-task'],
            },
          };

          const once = gameReducer(state, { type: 'COMPLETE_TASK', levelId, taskIds: incoming });
          const twice = gameReducer(once, { type: 'COMPLETE_TASK', levelId, taskIds: incoming });

          const expectedSet = new Set([...existing, ...incoming]);
          expect(new Set(once.completedTaskIds[levelId])).toEqual(expectedSet);
          expect(once.completedTaskIds[levelId].length).toBe(expectedSet.size);
          expect(twice.completedTaskIds[levelId]).toEqual(once.completedTaskIds[levelId]);
          expect(once.completedTaskIds[otherLevelId]).toEqual(['preserved-task']);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// UPDATE_ZOXIDE
// ---------------------------------------------------------------------------

describe('property: UPDATE_ZOXIDE frecency tracking', () => {
  it('increments target count by 1, updates lastAccess, and preserves all other entries', () => {
    const base = createInitialState();
    const pathArb = constantFrom(
      '/home/guest/workspace',
      '/tmp',
      '/etc',
      '/new/path/a',
      '/new/path/b'
    );

    assert(
      property(array(pathArb, { minLength: 1, maxLength: 15 }), (paths) => {
        let state = base;

        for (const p of paths) {
          const beforeEntry = state.zoxideData[p];
          const beforeOthers = Object.entries(state.zoxideData).filter(([k]) => k !== p);
          const t0 = Date.now();
          const next = gameReducer(state, { type: 'UPDATE_ZOXIDE', path: p });
          const t1 = Date.now();

          expect(next.zoxideData[p].count).toBe((beforeEntry?.count ?? 0) + 1);
          expect(next.zoxideData[p].lastAccess).toBeGreaterThanOrEqual(t0);
          expect(next.zoxideData[p].lastAccess).toBeLessThanOrEqual(t1);

          for (const [otherKey, otherVal] of beforeOthers) {
            expect(next.zoxideData[otherKey]).toEqual(otherVal);
          }
          state = next;
        }
      }),
      { numRuns: 80 }
    );
  });
});

// ---------------------------------------------------------------------------
// Progression, stats, settings, gauntlet, and level 11 flags
// ---------------------------------------------------------------------------

describe('property: UPDATE_CONSCIOUSNESS, UPDATE_GAUNTLET, INCREMENT_STAT, UPDATE_SETTINGS, TOGGLE_SOUND, UPDATE_LEVEL_11_FLAGS', () => {
  it('UPDATE_CONSCIOUSNESS clamps finite and infinite payloads to [0, 100] and ignores NaN', () => {
    const base = createInitialState();
    const payloadArb = oneof(
      double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
      constantFrom(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
    );

    assert(
      property(integer({ min: 0, max: 100 }), payloadArb, (initialLevel, payload) => {
        const seeded: GameState = { ...base, consciousnessLevel: initialLevel };
        const next = gameReducer(seeded, { type: 'UPDATE_CONSCIOUSNESS', payload });

        if (Number.isNaN(payload)) {
          expect(next.consciousnessLevel).toBe(initialLevel);
        } else {
          expect(next.consciousnessLevel).toBe(Math.max(0, Math.min(100, payload)));
        }
        expect(next.consciousnessLevel).toBeGreaterThanOrEqual(0);
        expect(next.consciousnessLevel).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('UPDATE_GAUNTLET updates provided fields, preserves omitted ones, and clears notification on null', () => {
    const base = createInitialState();
    const notificationArb = oneof(
      constant<GameState['notification'] | undefined>(undefined),
      constant<GameState['notification'] | undefined>(null),
      record({ message: string({ maxLength: 20 }) })
    );

    assert(
      property(
        option(integer({ min: 0, max: 8 }), { nil: undefined }),
        option(integer({ min: 0, max: 8 }), { nil: undefined }),
        option(integer({ min: 0, max: 60 }), { nil: undefined }),
        notificationArb,
        (phase, score, timeLeft, notification) => {
          const state: GameState = {
            ...base,
            gauntletPhase: 2,
            gauntletScore: 1,
            timeLeft: 15,
            notification: { message: 'initial' },
          };
          const next = gameReducer(state, {
            type: 'UPDATE_GAUNTLET',
            phase,
            score,
            timeLeft,
            notification,
          });
          expect(next.gauntletPhase).toBe(phase ?? state.gauntletPhase);
          expect(next.gauntletScore).toBe(score ?? state.gauntletScore);
          expect(next.timeLeft).toBe(timeLeft ?? state.timeLeft);
          expect(next.notification).toEqual(
            notification !== undefined ? notification : state.notification
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('INCREMENT_STAT increments only the targeted stat by amount ?? 1', () => {
    const base = createInitialState();
    const allStats: (keyof GameStats)[] = [
      'fuzzyJumps',
      'fzfFinds',
      'filterUsage',
      'renames',
      'archivesEntered',
    ];

    assert(
      property(
        constantFrom(...allStats),
        option(integer({ min: -5, max: 25 }), { nil: undefined }),
        (stat, amount) => {
          const next = gameReducer(base, { type: 'INCREMENT_STAT', stat, amount });
          for (const key of allStats) {
            const expected = key === stat ? base.stats[key] + (amount ?? 1) : base.stats[key];
            expect(next.stats[key]).toBe(expected);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('UPDATE_SETTINGS merges partial payloads and TOGGLE_SOUND is an involution', () => {
    const base = createInitialState();

    assert(
      property(
        option(boolean(), { nil: undefined }),
        option(constantFrom<GameSettings['narrativeEffects']>('full', 'reduced', 'minimal'), {
          nil: undefined,
        }),
        (soundEnabled, narrativeEffects) => {
          const payload: Partial<GameSettings> = {};
          if (soundEnabled !== undefined) payload.soundEnabled = soundEnabled;
          if (narrativeEffects !== undefined) payload.narrativeEffects = narrativeEffects;

          const updated = gameReducer(base, { type: 'UPDATE_SETTINGS', payload });
          expect(updated.settings.soundEnabled).toBe(soundEnabled ?? base.settings.soundEnabled);
          expect(updated.settings.narrativeEffects).toBe(
            narrativeEffects ?? base.settings.narrativeEffects
          );

          const toggledOnce = gameReducer(updated, { type: 'TOGGLE_SOUND' });
          const toggledTwice = gameReducer(toggledOnce, { type: 'TOGGLE_SOUND' });
          expect(toggledOnce.settings.soundEnabled).toBe(!updated.settings.soundEnabled);
          expect(toggledOnce.settings.narrativeEffects).toBe(updated.settings.narrativeEffects);
          expect(toggledTwice.settings).toEqual(updated.settings);
        }
      ),
      { numRuns: 60 }
    );
  });

  it('UPDATE_LEVEL_11_FLAGS merges partial flags even when level11Flags starts undefined', () => {
    const base = createInitialState();

    assert(
      property(
        boolean(),
        option(boolean(), { nil: undefined }),
        option(boolean(), { nil: undefined }),
        option(array(stringMatching(/^[a-z0-9-]{1,6}$/), { maxLength: 4 }), { nil: undefined }),
        (startUndefined, triggeredHoneypot, selectedModern, scoutedFiles) => {
          const state: GameState = {
            ...base,
            level11Flags: startUndefined
              ? undefined
              : { triggeredHoneypot: true, selectedModern: false, scoutedFiles: ['f0'] },
          };
          const flags: Partial<NonNullable<GameState['level11Flags']>> = {};
          if (triggeredHoneypot !== undefined) flags.triggeredHoneypot = triggeredHoneypot;
          if (selectedModern !== undefined) flags.selectedModern = selectedModern;
          if (scoutedFiles !== undefined) flags.scoutedFiles = scoutedFiles;

          const next = gameReducer(state, { type: 'UPDATE_LEVEL_11_FLAGS', flags });
          const fallback = state.level11Flags ?? {
            triggeredHoneypot: false,
            selectedModern: false,
            scoutedFiles: [],
          };
          expect(next.level11Flags).toEqual({
            triggeredHoneypot: triggeredHoneypot ?? fallback.triggeredHoneypot,
            selectedModern: selectedModern ?? fallback.selectedModern,
            scoutedFiles: scoutedFiles ?? fallback.scoutedFiles,
          });
        }
      ),
      { numRuns: 60 }
    );
  });
});

// ---------------------------------------------------------------------------
// Modals, toggles, hints, and simple boolean flags
// ---------------------------------------------------------------------------

type ModalId = Extract<Action, { type: 'SET_MODAL_VISIBILITY' }>['modal'];

const MODAL_KEY_MAP: Record<ModalId, keyof GameState> = {
  help: 'showHelp',
  hint: 'showHint',
  map: 'showMap',
  info: 'showInfoPanel',
  threat: 'showThreatAlert',
  success: 'showSuccessToast',
  hiddenWarning: 'showHiddenWarning',
  sortWarning: 'showSortWarning',
  filterWarning: 'showFilterWarning',
  searchWarning: 'showSearchWarning',
};

const ALL_MODAL_IDS = Object.keys(MODAL_KEY_MAP) as ModalId[];

describe('property: modal visibility, toggles, hints, and boolean UI flags', () => {
  it('SET_MODAL_VISIBILITY updates only the targeted ModalId key across all 10 modals', () => {
    const base = createInitialState();

    assert(
      property(constantFrom(...ALL_MODAL_IDS), boolean(), (modal, visible) => {
        const next = gameReducer(base, { type: 'SET_MODAL_VISIBILITY', modal, visible });
        const targetKey = MODAL_KEY_MAP[modal];
        expect(next[targetKey]).toBe(visible);

        for (const otherModal of ALL_MODAL_IDS) {
          if (otherModal === modal) continue;
          const otherKey = MODAL_KEY_MAP[otherModal];
          expect(next[otherKey]).toBe(base[otherKey]);
        }

        const repeated = gameReducer(next, { type: 'SET_MODAL_VISIBILITY', modal, visible });
        expect(repeated[targetKey]).toBe(visible);
      }),
      { numRuns: 80 }
    );
  });

  it('TOGGLE_HELP, TOGGLE_MAP, TOGGLE_HINT are independent involutions', () => {
    const base = createInitialState();

    assert(
      property(boolean(), boolean(), boolean(), (showHelp, showMap, showHint) => {
        const state: GameState = { ...base, showHelp, showMap, showHint };

        const h1 = gameReducer(state, { type: 'TOGGLE_HELP' });
        expect(h1.showHelp).toBe(!showHelp);
        expect(h1.showMap).toBe(showMap);
        expect(h1.showHint).toBe(showHint);
        expect(gameReducer(h1, { type: 'TOGGLE_HELP' }).showHelp).toBe(showHelp);

        const m1 = gameReducer(state, { type: 'TOGGLE_MAP' });
        expect(m1.showMap).toBe(!showMap);
        expect(m1.showHelp).toBe(showHelp);
        expect(m1.showHint).toBe(showHint);
        expect(gameReducer(m1, { type: 'TOGGLE_MAP' }).showMap).toBe(showMap);

        const n1 = gameReducer(state, { type: 'TOGGLE_HINT' });
        expect(n1.showHint).toBe(!showHint);
        expect(n1.showHelp).toBe(showHelp);
        expect(n1.showMap).toBe(showMap);
        expect(gameReducer(n1, { type: 'TOGGLE_HINT' }).showHint).toBe(showHint);
      }),
      { numRuns: 40 }
    );
  });

  it('SET_HINT_STAGE, SET_EPISODE_INTRO, SET_BOOT_STATUS, and SET_SORT_KEY_HANDLER set their flags accurately', () => {
    const base = createInitialState();

    assert(
      property(
        integer({ min: 0, max: 10 }),
        boolean(),
        boolean(),
        boolean(),
        (stage, intro, boot, sort) => {
          const s1 = gameReducer(base, { type: 'SET_HINT_STAGE', stage });
          expect(s1.hintStage).toBe(stage);

          const s2 = gameReducer(s1, { type: 'SET_EPISODE_INTRO', visible: intro });
          expect(s2.showEpisodeIntro).toBe(intro);

          const s3 = gameReducer(s2, { type: 'SET_BOOT_STATUS', isBooting: boot });
          expect(s3.isBooting).toBe(boot);

          const s4 = gameReducer(s3, { type: 'SET_SORT_KEY_HANDLER', accept: sort });
          expect(s4.acceptNextKeyForSort).toBe(sort);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// UI state, pending ops, alerts, toasts, notifications, thoughts, action flags
// ---------------------------------------------------------------------------

type ActionFlagId = Extract<Action, { type: 'MARK_ACTION_USED' }>['actionId'];

const ACTION_FLAG_KEY_MAP: Record<ActionFlagId, keyof GameState> = {
  G: 'usedG',
  GI: 'usedGI',
  GC: 'usedGC',
  GR: 'usedGR',
  GH: 'usedGH',
  CtrlA: 'usedCtrlA',
  CtrlR: 'usedCtrlR',
  GG: 'usedGG',
  Down: 'usedDown',
  Up: 'usedUp',
  PreviewDown: 'usedPreviewDown',
  PreviewUp: 'usedPreviewUp',
  P: 'usedP',
  ShiftP: 'usedShiftP',
  X: 'usedX',
  D: 'usedD',
  TrashDelete: 'usedTrashDelete',
  HistoryBack: 'usedHistoryBack',
  HistoryForward: 'usedHistoryForward',
  SortM: 'usedSortM',
  Y: 'usedY',
  Search: 'usedSearch',
  SearchCleared: 'usedSearchCleared',
  Filter: 'usedFilter',
};

const ALL_ACTION_FLAG_IDS = Object.keys(ACTION_FLAG_KEY_MAP) as ActionFlagId[];

describe('property: linemode, pending ops, UPDATE_FS, MARK_ACTION_USED, alerts, toasts, notifications, thoughts, and scroll/buffer fields', () => {
  it('MARK_ACTION_USED sets only the targeted flag across all 24 actionIds and is idempotent', () => {
    const base = createInitialState();

    assert(
      property(constantFrom(...ALL_ACTION_FLAG_IDS), (actionId) => {
        const next = gameReducer(base, { type: 'MARK_ACTION_USED', actionId });
        const targetKey = ACTION_FLAG_KEY_MAP[actionId];
        expect(next[targetKey]).toBe(true);

        for (const otherId of ALL_ACTION_FLAG_IDS) {
          if (otherId === actionId) continue;
          const otherKey = ACTION_FLAG_KEY_MAP[otherId];
          expect(next[otherKey]).toBe(base[otherKey]);
        }

        const repeated = gameReducer(next, { type: 'MARK_ACTION_USED', actionId });
        expect(repeated[targetKey]).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('SET_LINEMODE, SET_DELETE_PENDING (including null clearing), SET_OVERWRITE_PENDING, and UPDATE_FS update state cleanly', () => {
    const base = createInitialState();

    assert(
      property(
        constantFrom<Linemode>('none', 'size', 'mtime', 'permissions'),
        constantFrom<'trash' | 'permanent'>('trash', 'permanent'),
        array(stringMatching(/^[a-z0-9-]{1,6}$/), { maxLength: 5 }),
        constantFrom<'trash' | 'permanent' | null | undefined>(
          'trash',
          'permanent',
          null,
          undefined
        ),
        boolean(),
        (linemode, initialDeleteType, deleteIds, deleteType, hasOverwrite) => {
          const seeded: GameState = { ...base, deleteType: initialDeleteType };
          const s1 = gameReducer(seeded, { type: 'SET_LINEMODE', mode: linemode });
          expect(s1.linemode).toBe(linemode);

          const s2 = gameReducer(s1, {
            type: 'SET_DELETE_PENDING',
            ids: deleteIds,
            deleteType,
          });
          expect(s2.pendingDeleteIds).toEqual(deleteIds);
          expect(s2.deleteType).toBe(deleteType !== undefined ? deleteType : s1.deleteType);

          const overwriteNode: FileNode | null = hasOverwrite
            ? { id: 'ow-1', name: 'dup.txt', type: 'file', content: 'data' }
            : null;
          const s3 = gameReducer(s2, { type: 'SET_OVERWRITE_PENDING', node: overwriteNode });
          expect(s3.pendingOverwriteNode).toBe(overwriteNode);

          const replacementFs = cloneFS(INITIAL_FS);
          const s4 = gameReducer(s3, { type: 'UPDATE_FS', fs: replacementFs });
          expect(s4.fs).toBe(replacementFs);
          expect(s4.fs).not.toBe(s3.fs);
        }
      ),
      { numRuns: 80 }
    );
  });

  it('ADD_ALERT / REMOVE_ALERT enforce id uniqueness and permanent dismissal, and SET_ALERT_MESSAGE sets message', () => {
    const base = createInitialState();
    const alertIdArb = constantFrom('alert-1', 'alert-2', 'alert-3', 'alert-4');
    const severityArb = constantFrom<GameAlert['severity']>('info', 'warning', 'error', 'success');
    const opArb = record({
      op: constantFrom('add', 'remove'),
      id: alertIdArb,
      title: string({ maxLength: 12 }),
      message: string({ maxLength: 20 }),
      severity: severityArb,
      timestamp: nat(10_000),
    });

    assert(
      property(array(opArb, { maxLength: 25 }), string({ maxLength: 30 }), (ops, alertMsg) => {
        let state = base;

        for (const step of ops) {
          if (step.op === 'add') {
            const alreadyPresent = state.alerts.some((a) => a.id === step.id);
            const alreadyDismissed = state.dismissedAlertIds.includes(step.id);
            const next = gameReducer(state, {
              type: 'ADD_ALERT',
              payload: {
                id: step.id,
                title: step.title,
                message: step.message,
                severity: step.severity,
                timestamp: step.timestamp,
              },
            });
            if (alreadyPresent || alreadyDismissed) {
              expect(next).toBe(state);
            } else {
              expect(next.alerts.some((a) => a.id === step.id)).toBe(true);
            }
            state = next;
          } else {
            const next = gameReducer(state, { type: 'REMOVE_ALERT', id: step.id });
            expect(next.alerts.some((a) => a.id === step.id)).toBe(false);
            expect(next.dismissedAlertIds).toContain(step.id);
            state = next;
          }

          // Invariants across every step: unique alert IDs, unique dismissed IDs,
          // and no dismissed ID present in active alerts.
          const activeIds = state.alerts.map((a) => a.id);
          expect(new Set(activeIds).size).toBe(activeIds.length);
          expect(new Set(state.dismissedAlertIds).size).toBe(state.dismissedAlertIds.length);
          for (const dismissed of state.dismissedAlertIds) {
            expect(activeIds).not.toContain(dismissed);
          }
        }

        const withMessage = gameReducer(state, { type: 'SET_ALERT_MESSAGE', message: alertMsg });
        expect(withMessage.alertMessage).toBe(alertMsg);
      }),
      { numRuns: 80 }
    );
  });

  it('SHOW_TOAST/HIDE_TOAST, SET_NOTIFICATION/CLEAR_NOTIFICATION, and SET_THOUGHT/CLEAR_THOUGHT round-trip cleanly', () => {
    const base = createInitialState();

    assert(
      property(
        string({ maxLength: 30 }),
        option(nat(10_000), { nil: undefined }),
        option(string({ maxLength: 15 }), { nil: undefined }),
        option(boolean(), { nil: undefined }),
        (text, duration, author, isThought) => {
          const toasted = gameReducer(base, { type: 'SHOW_TOAST', message: text, duration });
          expect(toasted.toast).toEqual({ message: text, duration });
          expect(gameReducer(toasted, { type: 'HIDE_TOAST' }).toast).toBeUndefined();

          const notified = gameReducer(base, {
            type: 'SET_NOTIFICATION',
            message: text,
            author,
            isThought,
            duration,
          });
          expect(notified.notification).toEqual({ message: text, author, isThought });
          expect(gameReducer(notified, { type: 'CLEAR_NOTIFICATION' }).notification).toBeNull();

          const thinking = gameReducer(base, {
            type: 'SET_THOUGHT',
            payload: { text, author },
          });
          expect(thinking.thought).toEqual({ text, author });
          expect(gameReducer(thinking, { type: 'CLEAR_THOUGHT' }).thought).toBeNull();
        }
      ),
      { numRuns: 60 }
    );
  });

  it('UPDATE_QUEST_MAP, SET_PREVIEW_SCROLL, SET_HELP_SCROLL, SET_FUZZY_INDEX, and SET_INPUT_BUFFER update target fields', () => {
    const base = createInitialState();

    assert(
      property(
        option(integer({ min: 0, max: 2 }), { nil: undefined }),
        option(integer({ min: 0, max: 14 }), { nil: undefined }),
        integer({ min: 0, max: 500 }),
        integer({ min: 0, max: 500 }),
        integer({ min: 0, max: 100 }),
        string({ maxLength: 40 }),
        (tab, missionIdx, previewScroll, helpScroll, fuzzyIndex, buffer) => {
          const seeded: GameState = { ...base, questMapTab: 1, questMapMissionIdx: 3 };
          const s1 = gameReducer(seeded, { type: 'UPDATE_QUEST_MAP', tab, missionIdx });
          expect(s1.questMapTab).toBe(tab ?? seeded.questMapTab);
          expect(s1.questMapMissionIdx).toBe(missionIdx ?? seeded.questMapMissionIdx);

          const s2 = gameReducer(s1, { type: 'SET_PREVIEW_SCROLL', scroll: previewScroll });
          expect(s2.previewScroll).toBe(previewScroll);

          const s3 = gameReducer(s2, { type: 'SET_HELP_SCROLL', scroll: helpScroll });
          expect(s3.helpScrollPosition).toBe(helpScroll);

          const s4 = gameReducer(s3, { type: 'SET_FUZZY_INDEX', index: fuzzyIndex });
          expect(s4.fuzzySelectedIndex).toBe(fuzzyIndex);

          const s5 = gameReducer(s4, { type: 'SET_INPUT_BUFFER', buffer });
          expect(s5.inputBuffer).toBe(buffer);
        }
      ),
      { numRuns: 60 }
    );
  });
});
