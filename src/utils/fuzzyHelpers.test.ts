import { describe, expect, it } from 'vitest';
import type { FileNode, GameState } from '../types';
import { getBaseFuzzyCandidates } from './fuzzyHelpers';

const fixture: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'visible',
      name: 'visible',
      type: 'dir',
      children: [{ id: 'v1', name: 'visible.txt', type: 'file' }],
    },
    {
      id: 'cfg',
      name: '.config',
      type: 'dir',
      children: [{ id: 'c1', name: 'secret.txt', type: 'file' }],
    },
    { id: 'dotfile', name: '.hidden.txt', type: 'file' },
  ],
};

const state = (overrides: Partial<GameState>): GameState =>
  ({
    mode: 'normal',
    levelIndex: 0,
    fs: fixture,
    currentPath: ['root'],
    zoxideData: {},
    showHidden: false,
    ...overrides,
  }) as unknown as GameState;

describe('getBaseFuzzyCandidates visibility', () => {
  it('offers no hidden paths while hidden entries are off', () => {
    const candidates = getBaseFuzzyCandidates(state({ showHidden: false }));

    expect(candidates.map((c) => c.path)).toEqual(['/visible/visible.txt']);
  });

  it('offers hidden paths while hidden entries are on', () => {
    const paths = getBaseFuzzyCandidates(state({ showHidden: true })).map((c) => c.path);

    expect(paths).toEqual(
      expect.arrayContaining(['/.config/secret.txt', '/.hidden.txt', '/visible/visible.txt'])
    );
  });

  it('keeps zoxide history unfiltered: levels 7-8 jump into hidden vault paths', () => {
    const fs: FileNode = {
      id: 'root',
      name: 'root',
      type: 'dir',
      children: [
        {
          id: 'cfg',
          name: '.config',
          type: 'dir',
          children: [{ id: 'vault', name: 'vault', type: 'dir', children: [] }],
        },
      ],
    };
    const candidates = getBaseFuzzyCandidates(
      state({
        mode: 'zoxide-jump',
        levelIndex: 6,
        fs,
        zoxideData: { '/.config/vault': { count: 1, lastAccess: Date.now() } },
      })
    );

    expect(candidates.map((c) => c.path)).toEqual(['/.config/vault']);
  });
});
