import { describe, it, expect } from 'vitest';
import { isValidTransition, GameMode } from './stateMachine';

describe('isValidTransition', () => {
  it('allows self-transitions', () => {
    expect(isValidTransition('normal', 'normal')).toBe(true);
    expect(isValidTransition('input-file', 'input-file')).toBe(true);
  });

  it('allows valid normal -> submode transitions', () => {
    expect(isValidTransition('normal', 'input-file')).toBe(true);
    expect(isValidTransition('normal', 'search')).toBe(true);
    expect(isValidTransition('normal', 'overwrite-confirm')).toBe(true);
  });

  it('allows valid submode -> normal transitions', () => {
    expect(isValidTransition('input-file', 'normal')).toBe(true);
    expect(isValidTransition('search', 'normal')).toBe(true);
    expect(isValidTransition('overwrite-confirm', 'normal')).toBe(true);
  });

  it('blocks invalid cross-mode transitions', () => {
    // Cannot jump from input-file directly to confirm-delete
    expect(isValidTransition('input-file', 'confirm-delete')).toBe(false);
    // Cannot jump from search directly to sort
    expect(isValidTransition('search', 'sort')).toBe(false);
  });

  it('allows special chaining logic if defined', () => {
    // Check if input-file -> overwrite-confirm is allowed (it is defined in VALID_TRANSITIONS)
    expect(isValidTransition('input-file', 'overwrite-confirm')).toBe(true);
  });

  it('handles unknown modes gracefully', () => {
    // Should return false and warn (console.warn mocked/ignored usually)
    expect(isValidTransition('unknown-mode' as GameMode, 'normal')).toBe(false);
  });
});
