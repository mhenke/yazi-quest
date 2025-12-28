import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../utils/viewHelpers';

// Integration-style checks covering multiple filenames (simulating different levels' assets)
describe('matchesFilter integration (smart-case across assets)', () => {
  const files = ['sector_map.png', 'sector.png', 'abc.png', 'CLAUDE.md', 'Config.TOML'];

  it('lowercase filter matches multiple variants (insensitive)', () => {
    const f = 'sec';
    const matched = files.filter((n) => matchesFilter(n, f));
    expect(matched).toEqual(expect.arrayContaining(['sector_map.png', 'sector.png']));
    expect(matched).not.toContain('abc.png');
  });

  it('uppercase filter enforces case-sensitivity', () => {
    // 'C' should match CLAUDE.md and Config.TOML (both have uppercase C)
    const m = files.filter((n) => matchesFilter(n, 'C'));
    expect(m).toEqual(expect.arrayContaining(['CLAUDE.md', 'Config.TOML']));
    // lowercase 'c' should match case-insensitively
    const mi = files.filter((n) => matchesFilter(n, 'c'));
    expect(mi).toEqual(expect.arrayContaining(['CLAUDE.md', 'Config.TOML', 'sector_map.png']));
  });
});
