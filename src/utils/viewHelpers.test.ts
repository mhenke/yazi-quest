import { describe, expect, it } from 'vitest';
import type { FileNode, GameState } from '../types';
import { getFilterRegex, getRecursiveSearchResults, getVisibleItems } from './viewHelpers';

const fixture: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'visible',
      name: 'visible',
      type: 'dir',
      children: [{ id: 'v1', name: 'needle.txt', type: 'file', content: 'needle' }],
    },
    {
      id: 'cfg',
      name: '.config',
      type: 'dir',
      children: [{ id: 'c1', name: 'needle.txt', type: 'file', content: 'needle' }],
    },
    { id: 'dotfile', name: '.needle-dot', type: 'file', content: 'needle' },
    { id: 'top', name: 'needle.cfg', type: 'file', content: 'needle' },
  ],
};

describe('getRecursiveSearchResults visibility', () => {
  it('excludes hidden entries and everything below hidden directories', () => {
    const results = getRecursiveSearchResults(fixture, 'needle', false);

    expect(results.map((r) => r.displayPath).sort()).toEqual(['needle.cfg', 'visible/needle.txt']);
  });

  it('includes hidden paths when showHidden is true', () => {
    const results = getRecursiveSearchResults(fixture, 'needle', true);

    expect(results.map((r) => r.displayPath).sort()).toEqual([
      '.config/needle.txt',
      '.needle-dot',
      'needle.cfg',
      'visible/needle.txt',
    ]);
  });
});

describe('getFilterRegex smart-case', () => {
  it('ignores uppercase letters used inside escapes', () => {
    const regex = getFilterRegex(String.raw`\Dfoo`);

    expect(regex).not.toBeNull();
    expect(regex!.test('XYZFOO')).toBe(true);
  });

  it('remains case-sensitive when the pattern has a literal uppercase letter', () => {
    const regex = getFilterRegex('Needle');

    expect(regex).not.toBeNull();
    expect(regex!.test('needle')).toBe(false);
    expect(regex!.test('Needle')).toBe(true);
  });
});

describe('getVisibleItems visibility', () => {
  it('drops hidden results left over from a search taken while hidden was shown', () => {
    const config = fixture.children![1].children![0];
    const visible = fixture.children![0].children![0];
    const base = {
      fs: fixture,
      currentPath: ['root'],
      searchQuery: 'needle',
      searchResults: [
        { ...config, displayPath: '.config/needle.txt' },
        { ...visible, displayPath: 'visible/needle.txt' },
      ],
      filters: {},
      sortBy: 'natural',
      sortDirection: 'asc',
    } as unknown as GameState;

    expect(
      getVisibleItems({ ...base, showHidden: false } as GameState).map((item) => item.id)
    ).toEqual(['v1']);
    expect(
      getVisibleItems({ ...base, showHidden: true } as GameState)
        .map((item) => item.id)
        .sort()
    ).toEqual(['c1', 'v1']);
  });
});
