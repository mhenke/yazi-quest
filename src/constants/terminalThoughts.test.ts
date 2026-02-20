import { describe, it, expect } from 'vitest';
import { terminalThoughts, getThoughtByTrigger } from './terminalThoughts';

describe('terminalThoughts', () => {
  it('should have thoughts for all three phases', () => {
    const phases = new Set(terminalThoughts.map((t) => t.phase));
    expect(phases).toEqual(new Set([1, 2, 3]));
  });

  it('should have unique IDs for all thoughts', () => {
    const ids = terminalThoughts.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should get thought by trigger condition', () => {
    const thought = getThoughtByTrigger('first_delete');
    expect(thought).toBeDefined();
    expect(thought?.phase).toBe(1);
  });
});
