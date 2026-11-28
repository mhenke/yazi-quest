import {
  assert,
  property,
  array,
  boolean,
  constantFrom,
  integer,
  oneof,
  option,
  record,
  string,
  stringMatching,
  subarray,
  tuple,
  uniqueArray,
  type Arbitrary,
} from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import {
  getLevelStartPath,
  checkHoneypotTriggered,
  checkCriticalFileDeletion,
  validateDeletions,
  checkGrabbingHoneypot,
  checkPastingHoneypot,
  checkAllTasksComplete,
} from './gameUtils';
import {
  getNarrativeAction,
  getActionIntensity,
  hasSearchViolation,
  hasBaselineViolation,
  guardProtocolViolations,
} from '../hooks/keyboard/utils';
import { findPathById, getNodeByPath, isProtected } from './fsHelpers';
import { LEVELS } from '../constants/levels';
import { INITIAL_FS } from '../constants/filesystem/initial';
import { applyFileSystemMutations } from '../constants/filesystem/mutations';
import { KEYBINDINGS } from '../constants/keybindings';
import type { FileNode, GameState, Level, LevelTask, SortBy, SortDirection } from '../types';
import type { Action } from '../hooks/gameReducer';

const CRITICAL_FOLDERS = new Set([
  'bin',
  'boot',
  'dev',
  'etc',
  'home',
  'lib',
  'lib64',
  'proc',
  'root',
  'run',
  'sbin',
  'sys',
  'usr',
  'var',
]);

const LEVEL_9_KEEPER_PATTERN = /\.(key|pid|sock)$/;
const VERTICAL_NAV_KEYS = new Set(['j', 'k', 'ArrowUp', 'ArrowDown', 'G', 'g']);

const NAV_INTENSITY_KEYS = new Set([
  'j',
  'k',
  'l',
  'h',
  'g',
  'G',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);
const ANALYSIS_INTENSITY_KEYS = new Set(['f', 's', '/']);
const HIGH_INTENSITY_KEYS = new Set(['x', 'p', 'P', 'd', 'D', 'y']);
const CTRL_HIGH_INTENSITY_KEYS = new Set(['a', 'x', 'v']);

const ALL_KEYBINDING_KEYS = KEYBINDINGS.flatMap((b) => b.keys);

const LEVEL_FS_BY_ID = new Map<number, FileNode>(
  LEVELS.map((level) => [level.id, applyFileSystemMutations(INITIAL_FS, level.id)])
);

const LEVEL_FS_SNAPSHOT_BY_ID = new Map<number, string>(
  LEVELS.map((level) => [level.id, JSON.stringify(LEVEL_FS_BY_ID.get(level.id))])
);

const projectLevel = (levelIndex: number, completedTaskIds: Record<number, string[]>): Level => {
  const raw = LEVELS[levelIndex];
  const done = completedTaskIds[raw.id] || [];
  return { ...raw, tasks: raw.tasks.map((t) => ({ ...t, completed: done.includes(t.id) })) };
};

const makeState = (overrides: Partial<GameState> = {}): GameState =>
  ({
    fs: { id: 'root', name: 'root', type: 'dir', children: [] },
    levelStartFS: { id: 'root', name: 'root', type: 'dir', children: [] },
    levelStartPath: ['root'],
    currentPath: ['root'],
    cursorIndex: 0,
    clipboard: null,
    mode: 'normal',
    inputBuffer: '',
    filters: {},
    sortBy: 'natural',
    sortDirection: 'asc',
    linemode: 'size',
    zoxideData: {},
    history: [],
    future: [],
    loadedDirIds: [],
    previewScroll: 0,
    levelIndex: 0,
    notification: null,
    thought: null,
    selectedIds: [],
    pendingDeleteIds: [],
    deleteType: null,
    pendingOverwriteNode: null,
    showHelp: false,
    showHint: false,
    hintStage: 0,
    showHidden: false,
    showInfoPanel: false,
    showEpisodeIntro: false,
    isBooting: false,
    timeLeft: null,
    keystrokes: 0,
    weightedKeystrokes: 0,
    lastActionIntensity: 0,
    startTime: 0,
    isGameOver: false,
    stats: { fuzzyJumps: 0, fzfFinds: 0, filterUsage: 0, renames: 0, archivesEntered: 0 },
    settings: { soundEnabled: false, narrativeEffects: 'minimal' },
    completedTaskIds: {},
    threatLevel: 0,
    threatStatus: 'CALM',
    searchQuery: null,
    searchResults: [],
    consciousnessLevel: 0,
    alerts: [],
    dismissedAlertIds: [],
    ...overrides,
  }) as GameState;

const isLiveHoneypotSpec = (node: FileNode): boolean =>
  Boolean((node.isHoneypot && !node.isDecoy) || node.content?.includes('HONEYPOT'));

const isLiveHoneypotOrTokenSpec = (node: FileNode): boolean =>
  isLiveHoneypotSpec(node) || node.name === 'access_token.key';

const isContentTrapSpec = (node: FileNode): boolean =>
  Boolean(node.content?.includes('HONEYPOT') || node.content?.includes('audit-trap'));

const arbNodeName = constantFrom(
  'normal.txt',
  '.hidden_note.txt',
  'access_token.key',
  'ghost_process.pid',
  'socket_001.sock',
  'mysockfile.txt',
  'passwordkey_backup.log',
  'active_log_sync.lock',
  'danger.trap',
  'payload.trap',
  '.secret.key',
  'security-audit.service',
  'config.yaml'
);

const arbNodeContent = constantFrom(
  undefined as string | undefined,
  '',
  'ordinary file contents',
  '# HONEYPOT - ACTIVE SYNC LOCK',
  'ExecStart=/usr/bin/audit-trap',
  'SIGNATURE TRAP PAYLOAD',
  'HONEYPOT and TRAP combined',
  'lowercase honeypot trap'
);

const arbFileNode = (idPrefix = 'n'): Arbitrary<FileNode> =>
  record({
    name: arbNodeName,
    type: constantFrom('file', 'dir', 'archive') as Arbitrary<FileNode['type']>,
    content: arbNodeContent,
    isHoneypot: option(boolean(), { nil: undefined }),
    isDecoy: option(boolean(), { nil: undefined }),
    protected: option(boolean(), { nil: undefined }),
  }).map((raw) => ({
    id: `${idPrefix}-${raw.name}`,
    name: raw.name,
    type: raw.type,
    ...(raw.content !== undefined ? { content: raw.content } : {}),
    ...(raw.isHoneypot !== undefined ? { isHoneypot: raw.isHoneypot } : {}),
    ...(raw.isDecoy !== undefined ? { isDecoy: raw.isDecoy } : {}),
    ...(raw.protected !== undefined ? { protected: raw.protected } : {}),
  }));

const arbUniqueFileNodes = (minLength = 0, maxLength = 8): Arbitrary<FileNode[]> =>
  array(arbFileNode(), { minLength, maxLength }).map((nodes) =>
    nodes.map((node, index) => ({ ...node, id: `node-${index}` }))
  );

const arbSortBy: Arbitrary<SortBy> = constantFrom(
  'natural',
  'alphabetical',
  'modified',
  'size',
  'extension'
);
const arbSortDirection: Arbitrary<SortDirection> = constantFrom('asc', 'desc');

const arbDirName = stringMatching(/^[a-z][a-z0-9_-]{1,7}$/);

// ============================================================================
// 1. getLevelStartPath
// ============================================================================

describe('property: getLevelStartPath', () => {
  it('resolves every shipped level on its mutated filesystem without mutating fs', () => {
    assert(
      property(integer({ min: 0, max: LEVELS.length - 1 }), (levelIndex) => {
        const level = LEVELS[levelIndex];
        const fs = LEVEL_FS_BY_ID.get(level.id)!;
        const expectedNames = level.initialPath || ['root', 'home', 'guest'];

        const first = getLevelStartPath(fs, level);
        const second = getLevelStartPath(fs, level);

        expect(first).toEqual(second);
        expect(first.length).toBe(expectedNames.length);
        expect(first[0]).toBe(fs.id);

        const resolved = getNodeByPath(fs, first);
        expect(resolved).toBeDefined();
        expect(resolved!.type).toBe('dir');

        // Every segment after root must match the directory name declared in initialPath
        for (let i = 1; i < first.length; i++) {
          const segmentNode = getNodeByPath(fs, first.slice(0, i + 1));
          expect(segmentNode?.name).toBe(expectedNames[i]);
        }

        expect(JSON.stringify(fs)).toBe(LEVEL_FS_SNAPSHOT_BY_ID.get(level.id));
      }),
      { numRuns: 60 }
    );
  });

  it('resolves player-created directories by name to generated IDs and honours fallback initialPath', () => {
    const arbChain = uniqueArray(arbDirName, { minLength: 1, maxLength: 4 });
    const arbIds = uniqueArray(stringMatching(/^gen-[a-z0-9]{2,6}$/), {
      minLength: 5,
      maxLength: 5,
    });

    assert(
      property(arbChain, arbIds, boolean(), (dirNames, ids, useFallback) => {
        const targetNames = useFallback ? ['home', 'guest'] : dirNames;
        const expectedIds = [ids[0], ...targetNames.map((_, idx) => ids[idx + 1])];

        // Build nested tree from leaf up, adding decoy siblings so name lookup is non-trivial
        let child: FileNode | null = null;
        for (let i = targetNames.length - 1; i >= 0; i--) {
          const decoy: FileNode = {
            id: `decoy-${i}`,
            name: `zzz_other_${i}`,
            type: 'dir',
            children: [],
          };
          child = {
            id: ids[i + 1],
            name: targetNames[i],
            type: 'dir',
            children: child ? [decoy, child] : [decoy],
          };
        }
        const root: FileNode = {
          id: ids[0],
          name: 'root',
          type: 'dir',
          children: child ? [child] : [],
        };
        const snapshot = JSON.stringify(root);

        const level: Level = {
          ...LEVELS[0],
          initialPath: useFallback ? undefined : ['root', ...dirNames],
        };

        const path = getLevelStartPath(root, level);

        expect(path).toEqual(expectedIds);
        expect(getNodeByPath(root, path)?.name).toBe(targetNames[targetNames.length - 1]);
        expect(JSON.stringify(root)).toBe(snapshot);
      }),
      { numRuns: 150 }
    );
  });

  it('throws deterministically naming the first missing segment when a directory is absent', () => {
    const arbPathNames = uniqueArray(arbDirName, { minLength: 1, maxLength: 4 });

    assert(
      property(
        arbPathNames,
        integer({ min: 0, max: 3 }),
        integer({ min: 1, max: 20 }),
        boolean(),
        (segments, rawBreakIdx, levelId, omitChildrenProp) => {
          const breakIdx = rawBreakIdx % segments.length;
          // Build only prefix [0 .. breakIdx - 1]
          let leaf: FileNode | null = null;
          for (let i = breakIdx - 1; i >= 0; i--) {
            const node: FileNode = {
              id: `dir-${i}`,
              name: segments[i],
              type: 'dir',
            };
            if (leaf) {
              node.children = [leaf];
            } else if (!omitChildrenProp) {
              node.children = [];
            }
            leaf = node;
          }

          const root: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            ...(leaf ? { children: [leaf] } : omitChildrenProp ? {} : { children: [] }),
          };
          const snapshot = JSON.stringify(root);
          const level: Level = {
            ...LEVELS[0],
            id: levelId,
            initialPath: ['root', ...segments],
          };
          const expectedMsg = `Level ${levelId} start directory missing: ${segments[breakIdx]}`;

          expect(() => getLevelStartPath(root, level)).toThrow(expectedMsg);
          expect(() => getLevelStartPath(root, level)).toThrow(expectedMsg);
          expect(JSON.stringify(root)).toBe(snapshot);
        }
      ),
      { numRuns: 150 }
    );
  });
});

// ============================================================================
// 2. checkHoneypotTriggered
// ============================================================================

describe('property: checkHoneypotTriggered', () => {
  const nonSpecialLevels = LEVELS.filter((l) => l.id !== 9 && l.id !== 14);
  const level9 = LEVELS.find((l) => l.id === 9)!;
  const level14 = LEVELS.find((l) => l.id === 14)!;

  it('Level 14 (Sterilization) never triggers for any generated nodes or deletion list', () => {
    assert(
      property(
        arbUniqueFileNodes(0, 8),
        boolean(),
        array(constantFrom('node-0', 'node-1', 'node-2', 'node-3', 'missing-id'), {
          minLength: 0,
          maxLength: 6,
        }),
        (children, showHidden, pendingDeleteIds) => {
          const root: FileNode = { id: 'root', name: 'root', type: 'dir', children };
          const state = makeState({ fs: root, currentPath: ['root'], showHidden });
          const stateSnap = JSON.stringify(state);

          const res = checkHoneypotTriggered(state, pendingDeleteIds, level14);

          expect(res).toEqual({ triggered: false });
          expect(JSON.stringify(state)).toBe(stateSnap);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('non-L9/non-L14 levels match the selected honeypot & content-trap oracle and are order-independent for triggered', () => {
    assert(
      property(
        constantFrom(...nonSpecialLevels),
        arbUniqueFileNodes(0, 8),
        boolean(),
        boolean(),
        (level, children, showHidden, useSearchMode) => {
          const root: FileNode = { id: 'root', name: 'root', type: 'dir', children };
          const state = makeState({
            fs: root,
            currentPath: ['root'],
            showHidden,
            ...(useSearchMode ? { searchQuery: '.*', searchResults: children } : {}),
          });

          const allIds = [...children.map((c) => c.id), 'nonexistent-id'];

          const stateSnap = JSON.stringify(state);
          const first = checkHoneypotTriggered(state, allIds, level);
          const reversed = checkHoneypotTriggered(state, [...allIds].reverse(), level);
          const repeat = checkHoneypotTriggered(state, allIds, level);

          // Determinism & non-mutation
          expect(first).toEqual(repeat);
          expect(JSON.stringify(state)).toBe(stateSnap);

          // Every selected node counts, even when it is hidden or no longer in the current view.
          const hasFlagHoneypot = children.some((n) => Boolean(n.isHoneypot && !n.isDecoy));
          const hasContentTrap = children.some(isContentTrapSpec);
          const expectedTriggered = hasFlagHoneypot || hasContentTrap;

          expect(first.triggered).toBe(expectedTriggered);
          expect(reversed.triggered).toBe(expectedTriggered);

          if (expectedTriggered) {
            expect(first.reason).toBe('honeypot');
            expect(typeof first.message).toBe('string');
            expect(first.message!.length).toBeGreaterThan(0);
            if (hasFlagHoneypot) {
              expect(first.message).toContain('forensic alert');
            } else {
              expect(first.message).toContain('signature-trap');
            }
          } else {
            expect(first.reason).toBeUndefined();
            expect(first.message).toBeUndefined();
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('Level 9 matches the selected keeper oracle across arbitrary mixed batches and is order-independent', () => {
    assert(
      property(
        arbUniqueFileNodes(0, 8),
        boolean(),
        boolean(),
        integer({ min: 0, max: 8 }),
        (children, showHidden, useSearchMode, rawRotation) => {
          const root: FileNode = { id: 'root', name: 'root', type: 'dir', children };
          const state = makeState({
            fs: root,
            currentPath: ['root'],
            showHidden,
            ...(useSearchMode ? { searchQuery: '.*', searchResults: children } : {}),
          });

          const allIds = [...children.map((c) => c.id), 'nonexistent-id'];
          const rot = allIds.length > 0 ? rawRotation % allIds.length : 0;
          const rotatedIds = [...allIds.slice(rot), ...allIds.slice(0, rot)];
          const reversedIds = [...allIds].reverse();

          const stateSnap = JSON.stringify(state);
          const first = checkHoneypotTriggered(state, allIds, level9);
          const reversed = checkHoneypotTriggered(state, reversedIds, level9);
          const rotated = checkHoneypotTriggered(state, rotatedIds, level9);
          const repeat = checkHoneypotTriggered(state, allIds, level9);

          expect(first).toEqual(repeat);
          expect(JSON.stringify(state)).toBe(stateSnap);

          const flagKeepers = children.filter(
            (n) => Boolean(n.isHoneypot && !n.isDecoy) && LEVEL_9_KEEPER_PATTERN.test(n.name)
          );
          const contentKeepers = children.filter(
            (n) => isContentTrapSpec(n) && LEVEL_9_KEEPER_PATTERN.test(n.name)
          );
          const expectedTriggered = flagKeepers.length > 0 || contentKeepers.length > 0;

          expect(first.triggered).toBe(expectedTriggered);
          expect(reversed.triggered).toBe(expectedTriggered);
          expect(rotated.triggered).toBe(expectedTriggered);

          if (expectedTriggered) {
            expect(first.reason).toBe('honeypot');
            expect(reversed.reason).toBe('honeypot');
            expect(rotated.reason).toBe('honeypot');
            if (flagKeepers.length > 0) {
              expect(first.message).toContain('TRAP ACTIVATED');
              expect(reversed.message).toContain('TRAP ACTIVATED');
              expect(rotated.message).toContain('TRAP ACTIVATED');
            } else {
              expect(first.message).toContain('signature-trap');
              expect(reversed.message).toContain('signature-trap');
              expect(rotated.message).toContain('signature-trap');
            }
          } else {
            expect(first).toEqual({ triggered: false });
            expect(reversed).toEqual({ triggered: false });
            expect(rotated).toEqual({ triggered: false });
          }
        }
      ),
      { numRuns: 250 }
    );
  });

  it('Level 9 non-keeper decoys never mask keeper honeypots or block fallthrough to keeper content traps', () => {
    const arbDecoyName = constantFrom(
      'mysockfile.txt',
      'passwordkey_backup.log',
      'pid_summary.txt',
      'normal.txt'
    );
    const arbKeeperName = constantFrom('access_token.key', 'ghost_process.pid', 'socket_001.sock');
    const arbTrapContent = constantFrom(
      '# HONEYPOT - ACTIVE SYNC LOCK',
      'ExecStart=/usr/bin/audit-trap'
    );

    assert(
      property(
        arbDecoyName,
        arbKeeperName,
        constantFrom('flag-keeper', 'content-trap-keeper'),
        arbTrapContent,
        boolean(),
        (decoyName, keeperName, keeperKind, trapContent, decoyAlsoHasTrapContent) => {
          const decoy: FileNode = {
            id: 'decoy-1',
            name: decoyName,
            type: 'file',
            isHoneypot: true,
            ...(decoyAlsoHasTrapContent ? { content: trapContent } : {}),
          };
          const keeper: FileNode =
            keeperKind === 'flag-keeper'
              ? { id: 'keeper-1', name: keeperName, type: 'file', isHoneypot: true }
              : { id: 'keeper-1', name: keeperName, type: 'file', content: trapContent };

          const root: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: [decoy, keeper],
          };
          const state = makeState({ fs: root, currentPath: ['root'] });

          const decoyFirst = checkHoneypotTriggered(state, [decoy.id, keeper.id], level9);
          const keeperFirst = checkHoneypotTriggered(state, [keeper.id, decoy.id], level9);

          expect(decoyFirst).toEqual(keeperFirst);
          expect(decoyFirst.triggered).toBe(true);
          expect(decoyFirst.reason).toBe('honeypot');
          expect(decoyFirst.message).toContain(keeper.name);
          if (keeperKind === 'flag-keeper') {
            expect(decoyFirst.message).toContain('TRAP ACTIVATED');
          } else {
            expect(decoyFirst.message).toContain('signature-trap');
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it('Level 9 never triggers when deleting arbitrary batches of non-keeper decoys', () => {
    const arbNonKeeperNode = arbFileNode('decoy').filter(
      (n) => !LEVEL_9_KEEPER_PATTERN.test(n.name)
    );

    assert(
      property(
        array(arbNonKeeperNode, { minLength: 1, maxLength: 6 }),
        boolean(),
        (nodes, showHidden) => {
          const children = nodes.map((n, i) => ({ ...n, id: `d-${i}` }));
          const root: FileNode = { id: 'root', name: 'root', type: 'dir', children };
          const state = makeState({ fs: root, currentPath: ['root'], showHidden });
          const ids = children.map((c) => c.id);

          expect(checkHoneypotTriggered(state, ids, level9)).toEqual({ triggered: false });
        }
      ),
      { numRuns: 150 }
    );
  });
});

// ============================================================================
// 3. checkGrabbingHoneypot & checkPastingHoneypot
// ============================================================================

describe('property: checkGrabbingHoneypot', () => {
  const arbLevelIndex = oneof(
    constantFrom(5, 6, 10, 11), // L6, L7, L11, L12 special modal levels
    integer({ min: 0, max: LEVELS.length - 1 }),
    integer({ min: -2, max: 20 })
  );

  it('matches the level-carve-out severity and trigger oracle across arbitrary nodes and levels', () => {
    assert(
      property(arbUniqueFileNodes(0, 8), arbLevelIndex, (nodes, levelIndex) => {
        const snapshot = JSON.stringify(nodes);
        const res = checkGrabbingHoneypot(nodes, levelIndex);

        const levelId = levelIndex + 1;
        const hasLive = nodes.some(isLiveHoneypotSpec);
        const hasToken = nodes.some((n) => n.name === 'access_token.key');
        const expectedTriggered = hasLive || hasToken;

        const isModalLevel =
          ((levelId === 6 || levelId === 11 || levelId === 12) && hasLive) ||
          (levelId === 7 && hasToken);
        const expectedSeverity = isModalLevel ? 'modal' : 'notification';

        expect(res.triggered).toBe(expectedTriggered);
        expect(res.severity).toBe(expectedSeverity);
        if (expectedTriggered) {
          expect(typeof res.message).toBe('string');
          expect(res.message!.length).toBeGreaterThan(0);
          if (levelId === 6 && hasLive) expect(res.message).toContain('PROTOCOL VIOLATION');
          if (levelId === 7 && hasToken) expect(res.message).toContain('access_token.key');
          if ((levelId === 11 || levelId === 12) && hasLive) {
            expect(res.message).toContain('HONEYPOT TRIGGERED');
          }
        } else {
          expect(res.message).toBeUndefined();
        }

        // Non-mutation & determinism
        expect(JSON.stringify(nodes)).toBe(snapshot);
        expect(checkGrabbingHoneypot(nodes, levelIndex)).toEqual(res);
      }),
      { numRuns: 200 }
    );
  });

  it('is permutation-invariant and monotonic when adding extra nodes', () => {
    assert(
      property(
        arbUniqueFileNodes(0, 6),
        arbFileNode('extra'),
        arbLevelIndex,
        (nodes, extra, levelIndex) => {
          const base = checkGrabbingHoneypot(nodes, levelIndex);
          const reversed = checkGrabbingHoneypot([...nodes].reverse(), levelIndex);
          const extended = checkGrabbingHoneypot([...nodes, extra], levelIndex);

          expect(reversed).toEqual(base);

          if (base.triggered) {
            expect(extended.triggered).toBe(true);
          }
          if (base.severity === 'modal') {
            expect(extended.severity).toBe('modal');
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('property: checkPastingHoneypot', () => {
  it('classifies fatal traps above standard honeypots, is permutation-invariant, and decomposes over singletons', () => {
    assert(
      property(arbUniqueFileNodes(0, 8), (nodes) => {
        const snapshot = JSON.stringify(nodes);
        const res = checkPastingHoneypot(nodes);
        const reversed = checkPastingHoneypot([...nodes].reverse());

        const hasFatal = nodes.some(
          (n) => n.name.endsWith('.trap') || Boolean(n.content?.includes('TRAP'))
        );
        const hasHoneypot = nodes.some(isLiveHoneypotOrTokenSpec);

        expect(res).toEqual(reversed);
        expect(JSON.stringify(nodes)).toBe(snapshot);

        if (hasFatal) {
          expect(res.triggered).toBe(true);
          expect(res.type).toBe('fatal');
          expect(res.message).toContain('CRITICAL SYSTEM VIOLATION');
        } else if (hasHoneypot) {
          expect(res.triggered).toBe(true);
          expect(res.type).toBe('warning');
          expect(res.message).toContain('SYSTEM TRAP ACTIVE');
        } else {
          expect(res).toEqual({ triggered: false, type: 'warning' });
        }

        // Disjunction over singletons
        const singles = nodes.map((n) => checkPastingHoneypot([n]));
        expect(res.triggered).toBe(singles.some((s) => s.triggered));
        expect(res.triggered && res.type === 'fatal').toBe(
          singles.some((s) => s.triggered && s.type === 'fatal')
        );
      }),
      { numRuns: 200 }
    );
  });
});

// ============================================================================
// 4. checkCriticalFileDeletion & validateDeletions
// ============================================================================

describe('property: checkCriticalFileDeletion', () => {
  const arbFolderName = constantFrom(
    ...Array.from(CRITICAL_FOLDERS),
    'tmp',
    'daemons',
    'nodes',
    'notes.txt',
    '.hidden',
    'custom_dir'
  );

  it('detects selected critical root entries regardless of the current view', () => {
    const arbRootPath = constantFrom(['root'], ['root', 'sub'], ['other'], [] as string[]);

    assert(
      property(
        arbRootPath,
        array(
          record({
            name: arbFolderName,
            type: constantFrom('dir', 'file') as Arbitrary<FileNode['type']>,
          }),
          { minLength: 0, maxLength: 8 }
        ),
        boolean(),
        (currentPath, rawChildren, showHidden) => {
          const children: FileNode[] = rawChildren.map((c, idx) => ({
            id: `item-${idx}`,
            name: c.name,
            type: c.type,
            ...(c.type === 'dir' ? { children: [] } : {}),
          }));
          const subDir: FileNode = { id: 'sub', name: 'sub', type: 'dir', children };
          const root: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: currentPath.includes('sub') ? [subDir] : children,
          };

          const state = makeState({ fs: root, currentPath, showHidden });
          const pendingIds = [...children.map((c) => c.id), 'unknown-id'];
          const stateSnap = JSON.stringify(state);

          const got = checkCriticalFileDeletion(state, pendingIds);
          const reversed = checkCriticalFileDeletion(state, [...pendingIds].reverse());

          const expected =
            !currentPath.includes('sub') &&
            children.some((node) => CRITICAL_FOLDERS.has(node.name));

          expect(got).toBe(expected);
          expect(reversed).toBe(expected);
          // Disjunction over singletons
          expect(got).toBe(pendingIds.some((id) => checkCriticalFileDeletion(state, [id])));
          expect(checkCriticalFileDeletion(state, [])).toBe(false);
          expect(JSON.stringify(state)).toBe(stateSnap);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('property: validateDeletions', () => {
  // Structured tree covering Level 2 watcher, Level 14 allowedDeletePaths + guest direct children,
  // Level 15 exfil/payload carve-outs, and general protected vs unprotected nodes.
  const VALIDATE_FS: FileNode = {
    id: 'root',
    name: 'root',
    type: 'dir',
    children: [
      {
        id: 'home',
        name: 'home',
        type: 'dir',
        protected: true,
        children: [
          {
            id: 'guest',
            name: 'guest',
            type: 'dir',
            protected: true,
            children: [
              {
                id: 'datastore',
                name: 'datastore',
                type: 'dir',
                protected: true,
                children: [
                  {
                    id: 'ds-file',
                    name: 'data.bin',
                    type: 'file',
                    parentId: 'datastore',
                    protected: true,
                  },
                ],
              },
              {
                id: '.config',
                name: '.config',
                type: 'dir',
                protected: true,
                parentId: 'guest',
                children: [
                  {
                    id: 'vault',
                    name: 'vault',
                    type: 'dir',
                    protected: true,
                    parentId: '.config',
                    children: [],
                  },
                ],
              },
              {
                id: 'guest-prot',
                name: 'locked.txt',
                type: 'file',
                protected: true,
                parentId: 'guest',
              },
              {
                id: 'guest-open',
                name: 'notes.txt',
                type: 'file',
                parentId: 'guest',
              },
              {
                id: 'watcher',
                name: 'watcher_agent.sys',
                type: 'file',
                parentId: 'guest',
              },
              {
                id: 'exfil',
                name: 'exfil_04.log',
                type: 'file',
                protected: true,
                parentId: 'guest',
              },
              {
                id: 'payload',
                name: 'payload.py',
                type: 'file',
                protected: true,
                parentId: 'guest',
              },
              {
                id: 'scratch',
                name: 'scratch',
                type: 'dir',
                protected: true,
                parentId: 'guest',
                children: [
                  {
                    id: 'deep-prot',
                    name: 'deep.bin',
                    type: 'file',
                    protected: true,
                    parentId: 'scratch',
                  },
                  {
                    id: 'deep-open',
                    name: 'temp.tmp',
                    type: 'file',
                    parentId: 'scratch',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const VALIDATE_FS_SNAPSHOT = JSON.stringify(VALIDATE_FS);

  const SEARCH_NODES_WITH_PATH: FileNode[] = [
    {
      id: 'ds-file',
      name: 'data.bin',
      type: 'file',
      parentId: 'datastore',
      protected: true,
      path: ['root', 'home', 'guest', 'datastore', 'ds-file'],
    },
    {
      id: '.config',
      name: '.config',
      type: 'dir',
      parentId: 'guest',
      protected: true,
      path: ['root', 'home', 'guest', '.config'],
    },
    {
      id: 'watcher',
      name: 'watcher_agent.sys',
      type: 'file',
      parentId: 'guest',
      path: ['root', 'home', 'guest', 'watcher'],
    },
    {
      id: 'deep-prot',
      name: 'deep.bin',
      type: 'file',
      parentId: 'scratch',
      protected: true,
      path: ['root', 'home', 'guest', 'scratch', 'deep-prot'],
    },
    {
      id: 'deep-open',
      name: 'temp.tmp',
      type: 'file',
      parentId: 'scratch',
      path: ['root', 'home', 'guest', 'scratch', 'deep-open'],
    },
    {
      id: 'exfil',
      name: 'exfil_04.log',
      type: 'file',
      parentId: 'guest',
      protected: true,
      path: ['root', 'home', 'guest', 'exfil'],
    },
  ];

  const arbValidateCase = tuple(
    integer({ min: 0, max: LEVELS.length - 1 }),
    constantFrom(
      ['root', 'home', 'guest'],
      ['root', 'home', 'guest', 'scratch'],
      ['root', 'home', 'guest', 'datastore']
    ),
    boolean(),
    boolean()
  ).chain(([levelIndex, currentPath, showHidden, searchMode]) =>
    tuple(
      subarray(LEVELS[levelIndex].tasks.map((t) => t.id)),
      array(
        constantFrom(
          'datastore',
          'ds-file',
          '.config',
          'guest-prot',
          'guest-open',
          'watcher',
          'exfil',
          'payload',
          'scratch',
          'deep-prot',
          'deep-open',
          'unknown-id'
        ),
        { minLength: 0, maxLength: 6 }
      )
    ).map(([taskIds, pendingDeleteIds]) => ({
      levelIndex,
      currentPath,
      showHidden,
      searchMode,
      taskIds,
      pendingDeleteIds,
    }))
  );

  it('partitions all selected nodes into allowed vs blocked and approves only allowed batches', () => {
    assert(
      property(arbValidateCase, (c) => {
        const completedTaskIds = { [LEVELS[c.levelIndex].id]: c.taskIds };
        const level = projectLevel(c.levelIndex, completedTaskIds);
        const state = makeState({
          fs: VALIDATE_FS,
          currentPath: [...c.currentPath],
          showHidden: c.showHidden,
          completedTaskIds,
          ...(c.searchMode ? { searchQuery: '.*', searchResults: SEARCH_NODES_WITH_PATH } : {}),
        });

        const result = validateDeletions(state, c.pendingDeleteIds, level);
        const repeat = validateDeletions(state, c.pendingDeleteIds, level);

        // Determinism & non-mutation
        expect(result).toEqual(repeat);
        expect(JSON.stringify(VALIDATE_FS)).toBe(VALIDATE_FS_SNAPSHOT);

        // Partition every selected node using its actual parent.
        const blockedErrors: string[] = [];
        for (const id of c.pendingDeleteIds) {
          const path = findPathById(state.fs, id);
          const node = getNodeByPath(state.fs, path);
          if (!node || !path) continue;
          const targetDirPath = path.slice(0, -1);
          const err = isProtected(
            state.fs,
            targetDirPath,
            node,
            level,
            'delete',
            state.completedTaskIds
          );
          if (err !== null) blockedErrors.push(err);
        }

        // Batch agrees with singleton partition
        const allSingletonsOk = c.pendingDeleteIds.every(
          (id) => validateDeletions(state, [id], level).ok
        );
        expect(result.ok).toBe(blockedErrors.length === 0);
        expect(result.ok).toBe(allSingletonsOk);

        if (!result.ok) {
          expect(result.error).toBe(blockedErrors[0]);
          expect(result.error.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});

// ============================================================================
// 5. checkAllTasksComplete
// ============================================================================

describe('property: checkAllTasksComplete', () => {
  it('returns true iff every task is in completedTaskIds[level.id] or hidden, ignoring t.completed and other levels', () => {
    const arbTaskSpec = record({
      completedFlag: boolean(),
      hiddenMode: constantFrom('none', 'always-true', 'always-false', 'when-hidden-shown'),
    });

    assert(
      property(
        integer({ min: 1, max: 30 }),
        array(arbTaskSpec, { minLength: 0, maxLength: 7 }),
        boolean(),
        (levelId, taskSpecs, showHidden) => {
          const tasks: LevelTask[] = taskSpecs.map((spec, idx) => ({
            id: `task-${idx}`,
            description: `Task ${idx}`,
            check: () => false,
            completed: spec.completedFlag,
            ...(spec.hiddenMode === 'none'
              ? {}
              : {
                  hidden: (s: GameState) =>
                    spec.hiddenMode === 'always-true'
                      ? true
                      : spec.hiddenMode === 'always-false'
                        ? false
                        : s.showHidden,
                }),
          }));

          const level: Level = { ...LEVELS[0], id: levelId, tasks };

          // Pick an arbitrary subset of task ids to mark completed in completedTaskIds[levelId]
          const allTaskIds = tasks.map((t) => t.id);
          // Test several subsets deterministically derived from taskSpecs + distractor level IDs
          const completedForLevel = allTaskIds.filter((_, i) => i % 2 === 0);
          const stateWithSubset = makeState({
            showHidden,
            completedTaskIds: {
              [levelId]: completedForLevel,
              [levelId + 1]: allTaskIds, // unrelated level must not bleed in
            },
          });
          const stateSnap = JSON.stringify(stateWithSubset);

          const got = checkAllTasksComplete(stateWithSubset, level);
          const expected = tasks.every(
            (t) => completedForLevel.includes(t.id) || Boolean(t.hidden?.(stateWithSubset, level))
          );

          expect(got).toBe(expected);
          expect(JSON.stringify(stateWithSubset)).toBe(stateSnap);

          // Adding all task IDs must satisfy checkAllTasksComplete (monotonicity)
          const stateAllDone = makeState({
            showHidden,
            completedTaskIds: { [levelId]: allTaskIds },
          });
          expect(checkAllTasksComplete(stateAllDone, level)).toBe(true);

          // Missing level key behaves identically to empty completedTaskIds array
          const stateMissingKey = makeState({
            showHidden,
            completedTaskIds: { [levelId + 1]: allTaskIds },
          });
          const allHidden = tasks.every((t) => Boolean(t.hidden?.(stateMissingKey, level)));
          expect(checkAllTasksComplete(stateMissingKey, level)).toBe(allHidden);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('respects dynamic scenario hidden predicates on Level 12 and all shipped LEVELS', () => {
    const traceNames = [
      '.trace_scen_b1',
      '.trace_scen_b2',
      '.trace_scen_b3',
      '.trace_scen_a2',
      '.trace_scen_a3',
    ];

    assert(
      property(
        subarray(traceNames),
        subarray(LEVELS[11].tasks.map((t) => t.id)),
        (activeTraces, doneIds) => {
          const level12 = LEVELS[11];
          const fs: FileNode = {
            id: 'root',
            name: 'root',
            type: 'dir',
            children: [
              {
                id: '.config',
                name: '.config',
                type: 'dir',
                children: activeTraces.map((name, i) => ({
                  id: `tr-${i}`,
                  name,
                  type: 'file' as const,
                })),
              },
            ],
          };
          const state = makeState({
            fs,
            completedTaskIds: { [level12.id]: doneIds },
          });

          const requiredIds = level12.tasks
            .filter((t) => !t.hidden?.(state, level12))
            .map((t) => t.id);

          expect(checkAllTasksComplete(state, level12)).toBe(
            requiredIds.every((id) => doneIds.includes(id))
          );

          // Exact sufficiency: completing all required (non-hidden) tasks makes it true,
          // dropping any one required task flips it to false.
          const exactState = makeState({
            fs,
            completedTaskIds: { [level12.id]: requiredIds },
          });
          expect(checkAllTasksComplete(exactState, level12)).toBe(true);

          if (requiredIds.length > 0) {
            const missingOne = makeState({
              fs,
              completedTaskIds: { [level12.id]: requiredIds.slice(1) },
            });
            expect(checkAllTasksComplete(missingOne, level12)).toBe(false);
          }
        }
      ),
      { numRuns: 150 }
    );
  });
});

// ============================================================================
// 6. keyboard/utils.ts: getNarrativeAction & getActionIntensity
// ============================================================================

describe('property: keyboard/utils getNarrativeAction & getActionIntensity', () => {
  const arbKey = oneof(
    constantFrom(...ALL_KEYBINDING_KEYS),
    constantFrom(
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      '/',
      'a',
      'v',
      'x',
      'D',
      '',
      '__proto__',
      'constructor',
      'toString'
    ),
    string({ minLength: 0, maxLength: 6 })
  );

  it('getNarrativeAction is total and returns an entry from the matching KEYBINDINGS record or null', () => {
    assert(
      property(arbKey, (key) => {
        const result = getNarrativeAction(key);
        const binding = KEYBINDINGS.find((b) => b.keys.includes(key));

        if (binding && binding.narrativeDescription) {
          expect(typeof result).toBe('string');
          expect(result!.length).toBeGreaterThan(0);
          if (Array.isArray(binding.narrativeDescription)) {
            expect(binding.narrativeDescription).toContain(result);
          } else {
            expect(result).toBe(binding.narrativeDescription);
          }
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('getActionIntensity is total, bounded in {1, 3, 5}, matches the noise table, and is monotonic in ctrlKey', () => {
    assert(
      property(arbKey, boolean(), (key, ctrlKey) => {
        const intensity = getActionIntensity(key, ctrlKey);
        const repeat = getActionIntensity(key, ctrlKey);

        expect(intensity).toBe(repeat);
        expect([1, 3, 5]).toContain(intensity);
        expect(intensity).toBeGreaterThanOrEqual(1);
        expect(intensity).toBeLessThanOrEqual(5);

        // Exact oracle
        let expected = 1;
        if (NAV_INTENSITY_KEYS.has(key)) {
          expected = 1;
        } else if (ANALYSIS_INTENSITY_KEYS.has(key)) {
          expected = 3;
        } else if (HIGH_INTENSITY_KEYS.has(key) || (ctrlKey && CTRL_HIGH_INTENSITY_KEYS.has(key))) {
          expected = 5;
        }
        expect(intensity).toBe(expected);

        // Holding Ctrl never decreases instruction noise
        expect(getActionIntensity(key, true)).toBeGreaterThanOrEqual(
          getActionIntensity(key, false)
        );
      }),
      { numRuns: 200 }
    );
  });
});

// ============================================================================
// 7. keyboard/utils.ts: hasSearchViolation, hasBaselineViolation, checkProtocolViolations
// ============================================================================

describe('property: keyboard/utils protocol violation checks', () => {
  const PROTOCOL_FS: FileNode = {
    id: 'root',
    name: 'root',
    type: 'dir',
    children: [
      { id: 'dir-a', name: 'alpha', type: 'dir', children: [] },
      { id: 'dir-b', name: 'beta', type: 'dir', children: [] },
    ],
  };

  const arbProtocolState = record({
    currentPath: constantFrom(
      ['root'],
      ['root', 'dir-a'],
      ['root', 'dir-b'],
      ['root', 'missing-dir'],
      [] as string[]
    ),
    showHidden: boolean(),
    sortBy: arbSortBy,
    sortDirection: arbSortDirection,
    searchQuery: constantFrom(null as string | null, '', 'foo', '\\.log$'),
    searchResultCount: integer({ min: 0, max: 3 }),
    filterRoot: constantFrom('', 'abc', '\\.txt$'),
    filterDirA: constantFrom('', 'log'),
    filterDirB: constantFrom('', 'cfg'),
  }).map((spec) => {
    const filters: Record<string, string> = {};
    if (spec.filterRoot !== '') filters['root'] = spec.filterRoot;
    if (spec.filterDirA !== '') filters['dir-a'] = spec.filterDirA;
    if (spec.filterDirB !== '') filters['dir-b'] = spec.filterDirB;
    // Also exercise explicit empty-string entries occasionally
    if (spec.filterRoot === '' && spec.showHidden) filters['root'] = '';

    const searchResults: FileNode[] = Array.from({ length: spec.searchResultCount }, (_, i) => ({
      id: `sr-${i}`,
      name: `file${i}.txt`,
      type: 'file',
    }));

    return makeState({
      fs: PROTOCOL_FS,
      currentPath: spec.currentPath,
      showHidden: spec.showHidden,
      sortBy: spec.sortBy,
      sortDirection: spec.sortDirection,
      searchQuery: spec.searchQuery,
      searchResults,
      filters,
    });
  });

  const arbNavKey = oneof(
    constantFrom('j', 'k', 'ArrowUp', 'ArrowDown', 'G', 'g'),
    constantFrom('h', 'l', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'x', 'p', 'd', 'Escape'),
    string({ minLength: 1, maxLength: 3 })
  );

  it('hasSearchViolation and hasBaselineViolation match their documented predicates without mutation', () => {
    assert(
      property(arbProtocolState, (state) => {
        const snapshot = JSON.stringify(state);

        const searchViol = hasSearchViolation(state);
        const baselineViol = hasBaselineViolation(state);

        const currentDir = getNodeByPath(state.fs, state.currentPath);
        const expectedFilter = Boolean(currentDir && state.filters[currentDir.id]);
        const expectedSearch = state.searchQuery !== null;
        const expectedSort = state.sortBy !== 'natural' || state.sortDirection !== 'asc';
        const expectedHidden = state.showHidden;

        expect(searchViol).toBe(expectedSearch);
        expect(baselineViol).toBe(
          expectedFilter || expectedSearch || expectedSort || expectedHidden
        );

        // Determinism & non-mutation
        expect(hasSearchViolation(state)).toBe(searchViol);
        expect(hasBaselineViolation(state)).toBe(baselineViol);
        expect(JSON.stringify(state)).toBe(snapshot);
      }),
      { numRuns: 200 }
    );
  });

  it('checkProtocolViolations blocks iff an active blocking violation holds, respects side-effects, and coheres with hasBaselineViolation', () => {
    assert(
      property(arbProtocolState, arbNavKey, boolean(), (state, key, allTasksComplete) => {
        const snapshot = JSON.stringify(state);
        const preventDefault = vi.fn();
        const dispatch = vi.fn<(action: Action) => void>();
        const event = { key, preventDefault };

        const level: Level = {
          ...LEVELS[0],
          tasks: allTasksComplete ? [] : LEVELS[0].tasks,
        };
        const blocked = guardProtocolViolations(event, {
          gameState: { ...state, completedTaskIds: {} },
          dispatch,
          currentLevel: level,
        });

        const currentDir = getNodeByPath(state.fs, state.currentPath);
        const filter = Boolean(currentDir && state.filters[currentDir.id]);
        const search = state.searchQuery !== null;
        const sort = state.sortBy !== 'natural' || state.sortDirection !== 'asc';
        const hidden = state.showHidden;
        const isVertical = VERTICAL_NAV_KEYS.has(key);

        const expectedBlocked =
          filter || search || (sort && !isVertical) || (hidden && allTasksComplete);

        expect(blocked).toBe(expectedBlocked);
        expect(JSON.stringify(state)).toBe(snapshot);

        // Coherence with hasBaselineViolation
        if (!hasBaselineViolation(state)) {
          expect(blocked).toBe(false);
        }
        if (!isVertical && allTasksComplete) {
          expect(blocked).toBe(hasBaselineViolation(state));
        }

        if (!blocked) {
          expect(preventDefault).not.toHaveBeenCalled();
          expect(dispatch).not.toHaveBeenCalled();
        } else {
          expect(preventDefault).toHaveBeenCalledTimes(1);
          expect(dispatch).toHaveBeenCalledTimes(1);
          const action = dispatch.mock.calls[0][0];
          expect(action.type).toBe('SET_MODAL_VISIBILITY');
          if (action.type === 'SET_MODAL_VISIBILITY') {
            expect(action.visible).toBe(true);
            const isSortBlocking = sort && !isVertical;
            const expectedModal = filter
              ? 'filterWarning'
              : search
                ? 'searchWarning'
                : isSortBlocking
                  ? 'sortWarning'
                  : 'hiddenWarning';
            expect(action.modal).toBe(expectedModal);
          }
        }
      }),
      { numRuns: 250 }
    );
  });

  it('vertical navigation during custom sort only blocks on completed-level hidden violation and dispatches hiddenWarning', () => {
    const arbVerticalKey = constantFrom('j', 'k', 'ArrowUp', 'ArrowDown', 'G', 'g');
    const arbCustomSort = tuple(arbSortBy, arbSortDirection).filter(
      ([by, dir]) => by !== 'natural' || dir !== 'asc'
    );

    assert(
      property(
        arbVerticalKey,
        arbCustomSort,
        boolean(),
        boolean(),
        (key, [sortBy, sortDirection], showHidden, allTasksComplete) => {
          const state = makeState({
            fs: PROTOCOL_FS,
            currentPath: ['root', 'dir-a'],
            sortBy,
            sortDirection,
            showHidden,
            searchQuery: null,
            filters: { 'dir-b': 'unrelated-filter' },
          });

          const preventDefault = vi.fn();
          const dispatch = vi.fn<(action: Action) => void>();
          const event = { key, preventDefault };

          const level: Level = {
            ...LEVELS[0],
            tasks: allTasksComplete ? [] : LEVELS[0].tasks,
          };
          const blocked = guardProtocolViolations(event, {
            gameState: { ...state, completedTaskIds: {} },
            dispatch,
            currentLevel: level,
          });

          // Only hidden && allTasksComplete can block vertical nav during custom sort
          expect(blocked).toBe(showHidden && allTasksComplete);
          if (!blocked) {
            expect(preventDefault).not.toHaveBeenCalled();
            expect(dispatch).not.toHaveBeenCalled();
          } else {
            expect(preventDefault).toHaveBeenCalledTimes(1);
            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch).toHaveBeenCalledWith({
              type: 'SET_MODAL_VISIBILITY',
              modal: 'hiddenWarning',
              visible: true,
            });
          }
        }
      ),
      { numRuns: 150 }
    );
  });
});
