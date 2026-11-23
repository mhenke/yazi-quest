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
import { getAllDirectoriesWithPaths, getNodeById, getNodeByPath } from '../utils/fsHelpers';
import { getVisibleItems } from '../utils/viewHelpers';

const stepArb = record({
  kind: constantFrom(
    'move',
    'navigate',
    'back',
    'forward',
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
});
