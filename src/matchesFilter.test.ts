import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../utils/viewHelpers';

describe('matchesFilter (Yazi smart-case)', () => {
  it('is case-insensitive when filter is all-lowercase', () => {
    expect(matchesFilter('Foo.txt', 'foo')).toBe(true);
    expect(matchesFilter('CLAUDE.md', 'c')).toBe(true);
    expect(matchesFilter('bar.TXT', 'txt')).toBe(true);
  });

  it('is case-sensitive when filter contains uppercase', () => {
    expect(matchesFilter('Foo.txt', 'Foo')).toBe(true);
    expect(matchesFilter('foo.txt', 'Foo')).toBe(false);
    expect(matchesFilter('CLAUDE.md', 'C')).toBe(true);
    expect(matchesFilter('claude.md', 'C')).toBe(false);
  });

  it('returns false when no match exists', () => {
    expect(matchesFilter('alpha.txt', 'z')).toBe(false);
  });
});
