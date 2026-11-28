import {
  assert,
  property,
  boolean,
  integer,
  constantFrom,
  subarray,
  tuple,
  type Arbitrary,
} from 'fast-check';
import { describe, it } from 'vitest';
import { isProtected } from './fsHelpers';
import { LEVELS } from '../constants/levels';
import type { FileNode, Level } from '../types';

/**
 * Protection rules as *documented*, asserted against a projection built exactly
 * like App.tsx builds `currentLevel` (clone LEVELS entries, inject `completed`
 * from `completedTaskIds`). The oracle below is written from the rule list, not
 * from the implementation body, so a refactor that quietly changes semantics
 * fails here even if every unit test still passes.
 *
 * Documented carve-outs beyond the plain `protected` flag, in the order the
 * rules are meant to be applied:
 *  - L14 delete: an explicit `allowedDeletePaths` entry decides (its
 *    `requiresTaskId` must be complete); otherwise a *direct* guest child is
 *    deletable; everything else falls through to normal protection.
 *  - L12 cut of `systemd-core`: allowed (its delete is still protected).
 *  - L14 cut of `vault`: allowed (exfiltration objective).
 *  - L15 rename/cut/delete of `exfil_04.log` / `payload.py`: allowed.
 *  - L2 delete of `watcher_agent.sys`: blocked while `locate-watcher` is not in
 *    the projected completed ids, null once it is.
 *  - `levelStartFS` on `'rename'`: when provided, a protected node whose id is
 *    absent from `levelStartFS` or whose name no longer matches its
 *    `levelStartFS` name (conflict-renamed `_1` / typo recovery) may be
 *    renamed; other actions still follow normal protection.
 */

/** Carve-out tables — kept as data so the oracle stays flat. */
const LEVEL_14 = 14;
const watcherCarveOut = (levelId: number, name: string, action?: string) =>
  levelId === 2 && name === 'watcher_agent.sys' && action === 'delete';
const namedCarveOut = (levelId: number, name: string, action?: string) =>
  (levelId === 12 && action === 'cut' && name === 'systemd-core') ||
  (levelId === 14 && action === 'cut' && name === 'vault') ||
  (levelId === 15 &&
    (name === 'exfil_04.log' || name === 'payload.py') &&
    (action === 'rename' || action === 'cut' || action === 'delete'));
const quarantineBlocked = (name: string, levelId: number) =>
  (name === 'workspace' && levelId < 6) || (name === 'daemons' && levelId < 11);

/** App.tsx's projection, repeated here on purpose: the property must hold of
 *  what the game actually passes in, not of a hand-built level. */
const projectLevel = (levelIndex: number, completedTaskIds: Record<number, string[]>): Level => {
  const raw = LEVELS[levelIndex];
  const done = completedTaskIds[raw.id] || [];
  return { ...raw, tasks: raw.tasks.map((t) => ({ ...t, completed: done.includes(t.id) })) };
};

/** Fixture: /home/guest with direct children, a protected nested dir, plus
 *  every special name. Two `systemd-core` and two `vault` nodes mirror the
 *  shipped filesystem; entry matching is by subtree, so placement matters. */
const n = (
  id: string,
  name: string,
  type: FileNode['type'],
  parentId: string,
  opts: { protected?: boolean; children?: FileNode[] } = {}
): FileNode => ({
  id,
  name,
  type,
  parentId,
  ...(opts.protected ? { protected: true } : {}),
  ...(opts.children ? { children: opts.children } : {}),
});

const FIXTURE: FileNode = n('root', 'root', 'dir', '0', {
  children: [
    n('home', 'home', 'dir', 'root', {
      protected: true,
      children: [
        n('guest', 'guest', 'dir', 'home', {
          protected: true,
          children: [
            // named in allowedDeletePaths, no requiresTaskId
            n('datastore', 'datastore', 'dir', 'guest', {
              protected: true,
              children: [n('traces', 'traces.bin', 'file', 'datastore')],
            }),
            n('incoming', 'incoming', 'dir', 'guest', { protected: true }),
            n('media', 'media', 'dir', 'guest', { protected: true }),
            n('g-workspace', 'workspace', 'dir', 'guest', {
              protected: true,
              children: [
                n('systemd-core', 'systemd-core', 'dir', 'g-workspace', { protected: true }),
              ],
            }),
            // allowed only after 'delete-visible' completes
            n('.config', '.config', 'dir', 'guest', {
              protected: true,
              children: [n('vault', 'vault', 'dir', '.config', { protected: true })],
            }),
            // guest children not named in allowedDeletePaths
            n('readme', 'readme.md', 'file', 'guest', { protected: true }),
            n('notes', 'notes.txt', 'file', 'guest'),
            n('watcher', 'watcher_agent.sys', 'file', 'guest'),
            n('exfil', 'exfil_04.log', 'file', 'guest', { protected: true }),
            n('payload', 'payload.py', 'file', 'guest', { protected: true }),
            // protected nested dir outside every allowed path
            n('scratch', 'scratch', 'dir', 'guest', {
              protected: true,
              children: [n('deep', 'deep.bin', 'file', 'scratch', { protected: true })],
            }),
          ],
        }),
      ],
    }),
    n('daemons', 'daemons', 'dir', 'root', {
      protected: true,
      children: [n('d-systemd-core', 'systemd-core', 'dir', 'daemons', { protected: true })],
    }),
    // unprotected twins, so "blocked iff level < N" is tested both ways
    n('logs-workspace', 'workspace', 'dir', 'root'),
    n('logs-daemons', 'daemons', 'dir', 'root'),
    n('tmp-vault', 'vault', 'dir', 'root'),
  ],
});

const FLAT: FileNode[] = (() => {
  const out: FileNode[] = [];
  const walk = (node: FileNode) => {
    out.push(node);
    node.children?.forEach(walk);
  };
  walk(FIXTURE);
  return out;
})();

/** Real fixture nodes (exercise `allowedDeletePaths` subtree matching)... */
const arbInTree: Arbitrary<FileNode> = integer({ min: 0, max: FLAT.length - 1 }).map(
  (i) => FLAT[i]
);
/** ...and synthetic name/parent/protected triples (exercise every other rule). */
const arbSynth: Arbitrary<FileNode> = tuple(
  constantFrom(
    'workspace',
    'daemons',
    'systemd-core',
    'vault',
    'exfil_04.log',
    'payload.py',
    'watcher_agent.sys',
    'datastore',
    '.config',
    'readme.md',
    'deep.bin'
  ),
  constantFrom('guest', 'root', 'scratch', 'central_relay', 'absent'),
  boolean(),
  constantFrom('file', 'dir')
).map(([name, parentId, isProtected, type]) => ({
  id: `synth-${name}-${parentId}`,
  name,
  type,
  parentId,
  ...(isProtected ? { protected: true } : {}),
}));

const arbNode: Arbitrary<FileNode> = tuple(arbInTree, arbSynth, boolean()).map(
  ([inTree, synth, useInTree]) => (useInTree ? inTree : synth)
);

const arbAction = constantFrom(
  'enter',
  'jump',
  'info',
  'delete',
  'cut',
  'rename',
  undefined as string | undefined
);

/** Is `node` inside the subtree addressed by an allowedDeletePaths name-path? */
const childByDirName = (parent: FileNode, name: string) =>
  parent.children?.find((c) => c.name === name && (c.type === 'dir' || c.type === 'archive'));

const subtreeHas = (node: FileNode, id: string): boolean =>
  node.id === id || (node.children ?? []).some((c) => subtreeHas(c, id));

const resolvesNamePath = (namePath: string[], id: string): boolean => {
  let cur: FileNode | undefined = FIXTURE;
  for (const segment of namePath) {
    if (!cur) return false;
    cur = childByDirName(cur, segment);
  }
  return !!cur && subtreeHas(cur, id);
};

/** First matching entry decides; the order is part of the documented rule. */
const allowedEntryFor = (level: Level, node: FileNode) =>
  (level.allowedDeletePaths ?? []).find((entry) => resolvesNamePath(entry.path, node.id));

/** The documented verdict, independent of `isProtected`. */
function oracle(
  level: Level,
  node: FileNode,
  action: string | undefined,
  completedTaskIds: Record<number, string[]>
): string | null {
  const done = completedTaskIds[level.id] || [];

  if (level.id === LEVEL_14 && action === 'delete') {
    const entry = allowedEntryFor(level, node);
    if (entry) {
      return !entry.requiresTaskId || done.includes(entry.requiresTaskId)
        ? null
        : 'blocked by requiresTaskId';
    }
    if (node.parentId === 'guest') return null;
  }

  if (namedCarveOut(level.id, node.name, action)) return null;

  if (node.protected) {
    if (action === 'rename') return 'immutable';
    if (action === 'enter' || action === 'jump' || action === 'info') {
      return quarantineBlocked(node.name, level.id) ? 'quarantined' : null;
    }
    return 'cannot be purged';
  }

  if (watcherCarveOut(level.id, node.name, action)) {
    return done.includes('locate-watcher') ? null : 'analysis first';
  }

  return null;
}

const FIXTURE_SNAPSHOT = JSON.stringify(FIXTURE);

describe('property: protection verdicts follow the documented rules', () => {
  const arbCase = tuple(integer({ min: 0, max: LEVELS.length - 1 }), arbNode, arbAction).chain(
    ([levelIndex, node, action]) =>
      subarray(LEVELS[levelIndex].tasks.map((t) => t.id)).map((taskIds) => ({
        levelIndex,
        node,
        action,
        taskIds,
      }))
  );

  it('matches the documented oracle for every level / node / action / task set', () => {
    assert(
      property(arbCase, ({ levelIndex, node, action, taskIds }) => {
        const completedTaskIds = { [LEVELS[levelIndex].id]: taskIds };
        const level = projectLevel(levelIndex, completedTaskIds);
        const got = isProtected(FIXTURE, undefined, node, level, action, completedTaskIds);
        const want = oracle(level, node, action, completedTaskIds);
        // Blocked vs allowed must agree; wording is UI copy, not policy, so the
        // oracle returns its own reason strings rather than the shipped ones.
        return want === null ? got === null : got !== null;
      }),
      { numRuns: 200 }
    );
  });

  it('is deterministic and independent of the path argument', () => {
    assert(
      property(arbCase, ({ levelIndex, node, action, taskIds }) => {
        const completedTaskIds = { [LEVELS[levelIndex].id]: taskIds };
        const level = projectLevel(levelIndex, completedTaskIds);
        const first = isProtected(FIXTURE, undefined, node, level, action, completedTaskIds);
        // Same inputs, and a freshly projected level built from the same state,
        // must give the same verdict; the path argument is unused by the rules.
        const calls = [
          isProtected(FIXTURE, undefined, node, level, action, completedTaskIds),
          isProtected(FIXTURE, ['root', 'home', 'guest'], node, level, action, completedTaskIds),
          isProtected(FIXTURE, ['root'], node, level, action, completedTaskIds),
          isProtected(
            FIXTURE,
            undefined,
            node,
            projectLevel(levelIndex, completedTaskIds),
            action,
            completedTaskIds
          ),
        ];
        return (
          calls.every((verdict) => String(verdict) === String(first)) &&
          // neither the fixture nor the projected level is mutated
          JSON.stringify(FIXTURE) === FIXTURE_SNAPSHOT &&
          JSON.stringify(level) === JSON.stringify(projectLevel(levelIndex, completedTaskIds))
        );
      }),
      { numRuns: 200 }
    );
  });

  it('protected + destructive => blocked, except the documented carve-outs', () => {
    assert(
      property(arbCase, ({ levelIndex, node, action, taskIds }) => {
        const level = projectLevel(levelIndex, { [LEVELS[levelIndex].id]: taskIds });
        if (!node.protected || (action !== 'delete' && action !== 'cut')) return true;
        const blocked = isProtected(FIXTURE, undefined, node, level, action) !== null;
        return (
          blocked ||
          namedCarveOut(level.id, node.name, action) ||
          allowedDeleteAt14(level, node, action, taskIds)
        );
      }),
      { numRuns: 200 }
    );
  });

  it('protected + enter/jump/info => only workspace (<6) and daemons (<11) are blocked', () => {
    assert(
      property(arbCase, ({ levelIndex, node, action, taskIds }) => {
        if (!node.protected || (action !== 'enter' && action !== 'jump' && action !== 'info')) {
          return true;
        }
        const level = projectLevel(levelIndex, { [LEVELS[levelIndex].id]: taskIds });
        const blocked = isProtected(FIXTURE, undefined, node, level, action) !== null;
        return blocked === quarantineBlocked(node.name, level.id);
      }),
      { numRuns: 200 }
    );
  });

  it('unprotected nodes are never blocked, except the L2 watcher gate', () => {
    assert(
      property(arbCase, ({ levelIndex, node, action, taskIds }) => {
        const level = projectLevel(levelIndex, { [LEVELS[levelIndex].id]: taskIds });
        if (node.protected) return true;
        const blocked =
          isProtected(FIXTURE, undefined, node, level, action, {
            [level.id]: taskIds,
          }) !== null;
        return (
          blocked ===
          (watcherCarveOut(level.id, node.name, action) && !taskIds.includes('locate-watcher'))
        );
      }),
      { numRuns: 200 }
    );
  });

  it('L2 watcher delete is blocked iff locate-watcher is not projected complete', () => {
    assert(
      property(
        arbNode,
        arbAction,
        subarray(LEVELS[1].tasks.map((t) => t.id)),
        (node, action, taskIds) => {
          if (node.name !== 'watcher_agent.sys') return true;
          const completedTaskIds = { [LEVELS[1].id]: taskIds };
          const level = projectLevel(1, completedTaskIds);
          const blocked =
            isProtected(FIXTURE, undefined, node, level, action, completedTaskIds) !== null;
          if (action !== 'delete') return true;
          const complete = level.tasks.find((t) => t.id === 'locate-watcher')?.completed === true;
          return node.protected ? blocked : blocked === !complete;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('L12 systemd-core cut is allowed while its delete stays protected', () => {
    assert(
      property(arbAction, (action) => {
        const level = projectLevel(11, { 12: [] });
        for (const node of FLAT.filter((x) => x.name === 'systemd-core')) {
          // cut is the carve-out; delete must still respect the protected flag
          if (isProtected(FIXTURE, undefined, node, level, 'cut') !== null) return false;
          if (node.protected && isProtected(FIXTURE, undefined, node, level, 'delete') === null) {
            return false;
          }
          // every remaining action follows the general rules
          const verdict = isProtected(FIXTURE, undefined, node, level, action);
          if (
            (verdict !== null) !==
            (action !== 'cut' && oracle(level, node, action, { 12: [] }) !== null)
          ) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('L14 allowedDeletePaths decide by requiresTaskId; direct guest children are deletable', () => {
    assert(
      property(subarray(LEVELS[13].tasks.map((t) => t.id)), (taskIds) => {
        const completedTaskIds = { [LEVELS[13].id]: taskIds };
        const level = projectLevel(13, completedTaskIds);
        for (const entry of level.allowedDeletePaths ?? []) {
          let cur: FileNode | undefined = FIXTURE;
          for (const segment of entry.path) cur = cur && childByDirName(cur, segment);
          if (!cur) continue;
          const complete = !entry.requiresTaskId || taskIds.includes(entry.requiresTaskId);
          for (const target of FLAT.filter((x) => subtreeHas(cur!, x.id))) {
            if (target.id === 'guest' || target.id === 'home' || target.id === 'root') continue;
            const blocked =
              isProtected(FIXTURE, undefined, target, level, 'delete', completedTaskIds) !== null;
            if (blocked === complete) return false;
          }
        }
        for (const child of FLAT.filter((x) => x.parentId === 'guest')) {
          const underEntry = (level.allowedDeletePaths ?? []).some((e) =>
            resolvesNamePath(e.path, child.id)
          );
          if (underEntry) continue;
          if (isProtected(FIXTURE, undefined, child, level, 'delete', completedTaskIds) !== null) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('L15 exfil_04.log / payload.py can be renamed, cut and deleted', () => {
    assert(
      property(
        constantFrom('exfil_04.log', 'payload.py'),
        constantFrom('rename', 'cut', 'delete'),
        (name, action) => {
          const level = projectLevel(14, { 15: [] });
          const nodes = FLAT.filter((x) => x.name === name);
          if (nodes.length === 0) return false;
          return nodes.every(
            (node) =>
              isProtected(FIXTURE, undefined, node, level, action) === null &&
              // navigation is not part of the carve-out: still protected-as-navigable
              isProtected(FIXTURE, undefined, node, level, 'enter') === null
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  it('L14 vault cut is allowed; its delete follows the allowedDeletePaths rules', () => {
    assert(
      property(subarray(LEVELS[13].tasks.map((t) => t.id)), (taskIds) => {
        const completedTaskIds = { [LEVELS[13].id]: taskIds };
        const level = projectLevel(13, completedTaskIds);
        const vaults = FLAT.filter((x) => x.name === 'vault');
        if (vaults.length === 0) return false;
        return vaults.every((vault) => {
          if (isProtected(FIXTURE, undefined, vault, level, 'cut', completedTaskIds) !== null) {
            return false;
          }
          // delete is not carved out: it follows the allowedDeletePaths rules
          const got = isProtected(FIXTURE, undefined, vault, level, 'delete', completedTaskIds);
          return (got === null) === (oracle(level, vault, 'delete', completedTaskIds) === null);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('levelStartFS only relaxes rename for created or renamed protected nodes without weakening other actions', () => {
    assert(
      property(
        arbCase,
        constantFrom('canonical', 'renamed', 'fresh'),
        ({ levelIndex, node, action, taskIds }, identityKind) => {
          const completedTaskIds = { [LEVELS[levelIndex].id]: taskIds };
          const level = projectLevel(levelIndex, completedTaskIds);
          const candidate: FileNode =
            identityKind === 'renamed'
              ? { ...node, name: `${node.name}_1` }
              : identityKind === 'fresh'
                ? { ...node, id: `fresh-${node.id}` }
                : node;

          const gotWithStart = isProtected(
            FIXTURE,
            undefined,
            candidate,
            level,
            action,
            completedTaskIds,
            FIXTURE
          );
          const baseline = isProtected(
            FIXTURE,
            undefined,
            candidate,
            level,
            action,
            completedTaskIds
          );

          if (action !== 'rename') {
            return gotWithStart === baseline;
          }

          if (!candidate.protected) {
            return gotWithStart === null;
          }

          // Special named carve-out stays exempt regardless of levelStartFS
          if (namedCarveOut(level.id, candidate.name, 'rename')) {
            return gotWithStart === null;
          }

          const startNode = FLAT.find((n) => n.id === candidate.id);
          const matchesCanonicalStart = !!startNode && startNode.name === candidate.name;
          return matchesCanonicalStart ? gotWithStart !== null : gotWithStart === null;
        }
      ),
      { numRuns: 200 }
    );
  });
});

/** Level 14 delete carve-out: matched allowed entry, or a direct guest child. */
function allowedDeleteAt14(
  level: Level,
  node: FileNode,
  action: string | undefined,
  taskIds: string[]
): boolean {
  if (level.id !== LEVEL_14 || action !== 'delete') return false;
  const entry = allowedEntryFor(level, node);
  if (entry) return !entry.requiresTaskId || taskIds.includes(entry.requiresTaskId);
  return node.parentId === 'guest';
}
