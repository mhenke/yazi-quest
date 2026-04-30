import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSkipIntroRequested,
  setSkipIntroRequested,
  resetSkipIntroRequested,
} from './skipIntroFlag';

describe('skipIntroFlag', () => {
  beforeEach(() => {
    resetSkipIntroRequested();
  });

  it('defaults to false', () => {
    expect(getSkipIntroRequested()).toBe(false);
  });

  it('set makes it true', () => {
    setSkipIntroRequested();
    expect(getSkipIntroRequested()).toBe(true);
  });

  it('reset makes it false again', () => {
    setSkipIntroRequested();
    resetSkipIntroRequested();
    expect(getSkipIntroRequested()).toBe(false);
  });
});
