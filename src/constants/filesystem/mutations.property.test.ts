import {
  assert,
  array,
  boolean,
  constantFrom,
  integer,
  option,
  property,
  record,
  stringMatching,
} from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LEVELS } from '../levels';
import { UPLINK_TRAP_CONTENT } from '../protocols';
import { BASE_TIME, day } from '../timings';
import type { FileNode, GameState } from '../../types';
import { cloneFS, getNodeById, getNodeByPath } from '../../utils/fsHelpers';
import { getLevelStartPath } from '../../utils/gameUtils';
import { INITIAL_FS } from './initial';
import { applyFileSystemMutations } from './mutations';
import { applyConsequenceScenarios, getOrCreateWorkspaceSystemdCore } from './scenarios';

const collectNodes = (fs: FileNode): FileNode[] => {
  const nodes: FileNode[] = [];
  const stack: FileNode[] = [fs];
  while (stack.length > 0) {
    const node = stack.pop()!;
    nodes.push(node);
    if (node.children) {
      stack.push(...node.children);
    }
  }
  return nodes;
};

const setScenarioQuery = (scenario: string | null): void => {
  const search = scenario === null ? '' : `?scenario=${encodeURIComponent(scenario)}`;
  window.history.replaceState({}, '', search ? `/${search}` : '/');
};

const SCENARIO_PARAMS = [
  null,
  'scen-a1',
  'scen-a2',
  'scen-a3',
  'scen-b1',
  'scen-b2',
  'scen-b3',
  'unknown',
] as const;

const arbLevel11Flags = option(
  record({
    triggeredHoneypot: boolean(),
    selectedModern: boolean(),
    scoutedFiles: array(stringMatching(/^[a-z0-9-]{1,10}$/), { maxLength: 4 }),
  }),
  { nil: undefined }
);

describe('property: filesystem mutations and consequence scenarios', () => {
  beforeEach(() => {
    setScenarioQuery(null);
  });

  afterEach(() => {
    setScenarioQuery(null);
  });

  it('applyFileSystemMutations is pure, preserves unique IDs, resolves start paths, and is idempotent', () => {
    const arbLevelIdx = integer({ min: 0, max: LEVELS.length - 1 });

    assert(
      property(
        arbLevelIdx,
        constantFrom(...SCENARIO_PARAMS),
        arbLevel11Flags,
        (levelIdx, scenarioParam, level11Flags) => {
          setScenarioQuery(scenarioParam);
          const level = LEVELS[levelIdx];
          const input = cloneFS(INITIAL_FS);
          const inputSnapshot = JSON.stringify(input);
          const gameState = { levelIndex: levelIdx, level11Flags } as GameState;

          const once = applyFileSystemMutations(input, level.id, gameState);
          expect(JSON.stringify(input)).toBe(inputSnapshot);

          const startPath = getLevelStartPath(once, level);
          expect(getNodeByPath(once, startPath)).toBeDefined();

          const ids = collectNodes(once).map((node) => node.id);
          expect(new Set(ids).size).toBe(ids.length);

          const twice = applyFileSystemMutations(once, level.id, gameState);
          expect(twice).toEqual(once);
        }
      ),
      { numRuns: 60 }
    );
  });

  it('applyConsequenceScenarios isolates legacy vs modern branches and is idempotent on repeated calls', () => {
    const arbLevelId = integer({ min: 12, max: LEVELS.length });
    const arbLevelIdx = integer({ min: 11, max: LEVELS.length - 1 });

    assert(
      property(
        arbLevelId,
        arbLevelIdx,
        constantFrom(...SCENARIO_PARAMS),
        arbLevel11Flags,
        (levelId, levelIdx, scenarioParam, level11Flags) => {
          setScenarioQuery(scenarioParam);
          const base = applyFileSystemMutations(cloneFS(INITIAL_FS), 11);
          const gameState = { levelIndex: levelIdx, level11Flags } as GameState;

          const once = applyConsequenceScenarios(cloneFS(base), levelId, gameState, BASE_TIME, day);
          const twice = applyConsequenceScenarios(
            cloneFS(once),
            levelId,
            gameState,
            BASE_TIME,
            day
          );
          expect(twice).toEqual(once);

          const ids = collectNodes(once).map((node) => node.id);
          expect(new Set(ids).size).toBe(ids.length);

          const effectiveModern = scenarioParam
            ? scenarioParam.startsWith('scen-b')
            : level11Flags
              ? level11Flags.triggeredHoneypot || level11Flags.selectedModern
              : true;

          if (effectiveModern) {
            expect(ids.some((id) => id.includes('scen-a'))).toBe(false);
          } else {
            expect(ids.some((id) => id.includes('scen-b'))).toBe(false);
          }
        }
      ),
      { numRuns: 80 }
    );
  });

  it('getOrCreateWorkspaceSystemdCore preserves player-added files without mutating input and toggles corruption', () => {
    const arbCustomFiles = array(stringMatching(/^custom-[a-z0-9]{1,8}\.service$/), {
      maxLength: 5,
    }).map((names) => Array.from(new Set(names)));

    assert(
      property(arbCustomFiles, boolean(), (customNames, isCorrupted) => {
        const seeded = getOrCreateWorkspaceSystemdCore(INITIAL_FS, false);
        const systemdCore = getNodeById(seeded, 'systemd-core');
        expect(systemdCore).toBeDefined();

        systemdCore!.children ??= [];
        for (const name of customNames) {
          systemdCore!.children.push({
            id: `player-${name}`,
            name,
            type: 'file',
            content: 'ExecStart=/bin/true',
            parentId: systemdCore!.id,
          });
        }

        const snapshot = JSON.stringify(seeded);
        const updated = getOrCreateWorkspaceSystemdCore(seeded, isCorrupted);

        expect(JSON.stringify(seeded)).toBe(snapshot);

        const updatedCore = getNodeById(updated, 'systemd-core');
        expect(updatedCore?.children).toBeDefined();
        for (const name of customNames) {
          expect(updatedCore!.children!.some((child) => child.name === name)).toBe(true);
        }

        const uplink = updatedCore!.children!.find((child) => child.name === 'uplink_v1.conf');
        expect(uplink).toBeDefined();
        if (isCorrupted) {
          expect(uplink!.content).toBe(UPLINK_TRAP_CONTENT);
        } else {
          expect(uplink!.content).not.toBe(UPLINK_TRAP_CONTENT);
        }
      }),
      { numRuns: 60 }
    );
  });
});
