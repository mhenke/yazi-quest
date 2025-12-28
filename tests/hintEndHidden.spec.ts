import { describe, it, expect } from 'vitest';
import { LEVELS } from '../constants';

describe('hintEndHidden presence', () => {
  it('Level 3 should define hintEndHidden to guide players when dotfiles are visible', () => {
    const lvl3 = LEVELS.find((l) => l.id === 3);
    expect(lvl3).toBeDefined();
    // @ts-expect-error - optional property
    expect((lvl3 as any).hintEndHidden).toBeTruthy();
  });

  it('Level 14 should define hintEndHidden to guide players when dotfiles are visible', () => {
    const lvl14 = LEVELS.find((l) => l.id === 14);
    expect(lvl14).toBeDefined();
    // @ts-expect-error - optional property
    expect((lvl14 as any).hintEndHidden).toBeTruthy();
  });
});
