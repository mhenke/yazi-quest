import { assert, property, boolean, constantFrom, integer, subarray } from 'fast-check';
import { describe, it } from 'vitest';
import type { FileNode } from '../../types';
import { LEVELS } from '../../constants/levels';
import { cloneFS, getNodeById } from '../../utils/fsHelpers';
import { makeBootState, makeKey } from '../../../tests/helpers/keyboardHarness';
import type { Action } from '../gameReducer';
import { handleConfirmDeleteModeKeyDown } from './handleDeleteMode';

const NUM_RUNS = 150;

const safeChildIds = ['a1', 'a2', 'b1', 'b2', 'nested-file'];

const buildBatchDeleteFs = (): FileNode => ({
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'dir-a',
      name: 'dir-a',
      type: 'dir',
      parentId: 'root',
      children: [
        { id: 'a1', name: 'a1.log', type: 'file', parentId: 'dir-a' },
        { id: 'a2', name: 'a2.log', type: 'file', parentId: 'dir-a' },
      ],
    },
    {
      id: 'dir-b',
      name: 'dir-b',
      type: 'dir',
      parentId: 'root',
      children: [
        { id: 'b1', name: 'b1.txt', type: 'file', parentId: 'dir-b' },
        { id: 'b2', name: 'b2.txt', type: 'file', parentId: 'dir-b' },
        {
          id: 'nested',
          name: 'nested',
          type: 'dir',
          parentId: 'dir-b',
          children: [{ id: 'nested-file', name: 'deep.txt', type: 'file', parentId: 'nested' }],
        },
      ],
    },
  ],
});

const runConfirmKey = (
  stateOverrides: Parameters<typeof makeBootState>[1],
  levelId: number,
  key: string
) => {
  const state = makeBootState(levelId, stateOverrides);
  const actions: Action[] = [];
  handleConfirmDeleteModeKeyDown(makeKey({ key }), {
    dispatch: (action) => actions.push(action),
    gameState: state,
    visibleItems: [],
    currentLevel: LEVELS.find((l) => l.id === levelId)!,
  });
  return actions;
};

describe('property: handleDeleteMode invariants', () => {
  it('routes y/Y to execution, n/N/Escape to clean cancellation, and ignores all other keys', () => {
    assert(
      property(constantFrom('y', 'Y', 'n', 'N', 'Escape', 'x', 'j', 'Enter', ' '), (key) => {
        const fs = buildBatchDeleteFs();
        const actions = runConfirmKey(
          { fs, currentPath: ['root', 'dir-a'], pendingDeleteIds: ['a1'] },
          1,
          key
        );
        const lower = key.toLowerCase();

        if (lower === 'y') {
          return actions.some((a) => a.type === 'DELETE_NODES');
        }
        if (lower === 'n' || key === 'Escape') {
          return (
            actions.length === 2 &&
            actions.some((a) => a.type === 'SET_MODE' && a.mode === 'normal') &&
            actions.some((a) => a.type === 'SET_DELETE_PENDING' && a.ids.length === 0)
          );
        }
        return actions.length === 0;
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('never dispatches DELETE_NODES when pending selection includes a fatal honeypot or critical root folder', () => {
    assert(
      property(
        constantFrom('honeypot' as const, 'critical' as const),
        constantFrom('bin', 'boot', 'etc', 'home', 'usr', 'var'),
        integer({ min: 0, max: LEVELS.length - 1 }),
        (hazardKind, criticalName, levelIdx) => {
          const level = LEVELS[levelIdx];
          if (hazardKind === 'honeypot' && level.id === 14) return true;

          const trapNode: FileNode =
            hazardKind === 'critical'
              ? { id: 'crit', name: criticalName, type: 'dir', parentId: 'root', children: [] }
              : {
                  id: 'trap',
                  name: 'trap.key',
                  type: 'file',
                  parentId: 'root',
                  isHoneypot: true,
                };
          const safeFile: FileNode = {
            id: 'safe',
            name: 'safe.txt',
            type: 'file',
            parentId: 'root',
          };
          const fs: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: [trapNode, safeFile],
          };

          const actions = runConfirmKey(
            { fs, currentPath: ['root'], pendingDeleteIds: ['safe', trapNode.id] },
            level.id,
            'y'
          );
          const expectedReason = hazardKind === 'honeypot' ? 'honeypot' : 'criticalFile';
          return (
            !actions.some((a) => a.type === 'DELETE_NODES') &&
            actions.some((a) => a.type === 'GAME_OVER' && a.reason === expectedReason)
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('blocks protected targets cleanly without dispatching DELETE_NODES', () => {
    assert(
      property(boolean(), boolean(), (isDir, alsoSelectSafe) => {
        const guarded: FileNode = {
          id: 'guarded',
          name: 'guarded_asset',
          type: isDir ? 'dir' : 'file',
          protected: true,
          parentId: 'dir-a',
          ...(isDir ? { children: [] } : {}),
        };
        const safe: FileNode = { id: 'safe', name: 'safe.txt', type: 'file', parentId: 'dir-a' };
        const dirA: FileNode = {
          id: 'dir-a',
          name: 'dir-a',
          type: 'dir',
          parentId: 'root',
          children: [guarded, safe],
        };
        const fs: FileNode = { id: 'root', name: 'root', type: 'dir', children: [dirA] };
        const pendingDeleteIds = alsoSelectSafe ? ['safe', 'guarded'] : ['guarded'];

        const actions = runConfirmKey(
          { fs, currentPath: ['root', 'dir-a'], pendingDeleteIds },
          1,
          'y'
        );
        return (
          !actions.some((a) => a.type === 'DELETE_NODES') &&
          actions.some((a) => a.type === 'SET_NOTIFICATION' && a.message.includes('PROTECTED'))
        );
      }),
      { numRuns: NUM_RUNS }
    );
  });

  it('cross-directory batch delete removes exact pending IDs, keeps all others, and never mutates input fs', () => {
    assert(
      property(subarray(safeChildIds), (pendingIds) => {
        const fs = buildBatchDeleteFs();
        const beforeSnapshot = JSON.stringify(fs);
        const actions = runConfirmKey(
          { fs: cloneFS(fs), currentPath: ['root'], pendingDeleteIds: pendingIds },
          1,
          'y'
        );
        const deletion = actions.find((a) => a.type === 'DELETE_NODES');
        if (!deletion || deletion.type !== 'DELETE_NODES') return false;

        const removedOk = pendingIds.every((id) => getNodeById(deletion.newFs, id) === undefined);
        const keptOk = safeChildIds
          .filter((id) => !pendingIds.includes(id))
          .every((id) => getNodeById(deletion.newFs, id) !== undefined);

        return removedOk && keptOk && JSON.stringify(fs) === beforeSnapshot;
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
