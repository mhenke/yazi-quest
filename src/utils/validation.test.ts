import { describe, it, expect } from 'vitest';
import { isValidZoxideData } from './validation';

describe('isValidZoxideData', () => {
  it('should return true for valid Zoxide data', () => {
    const validData = {
      '/home/user/docs': { count: 5, lastAccess: 123456789 },
      '/tmp': { count: 1, lastAccess: 987654321 },
    };
    expect(isValidZoxideData(validData)).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isValidZoxideData({})).toBe(true);
  });

  it('should return false for non-object input', () => {
    expect(isValidZoxideData(null)).toBe(false);
    expect(isValidZoxideData(undefined)).toBe(false);
    expect(isValidZoxideData('string')).toBe(false);
    expect(isValidZoxideData(123)).toBe(false);
    expect(isValidZoxideData([])).toBe(false);
  });

  it('should return false if values are not objects', () => {
    const invalidData = {
      '/home/user/docs': 5,
    };
    expect(isValidZoxideData(invalidData)).toBe(false);
  });

  it('should return false if ZoxideEntry is missing properties', () => {
    const invalidData = {
      '/home/user/docs': { count: 5 }, // missing lastAccess
    };
    expect(isValidZoxideData(invalidData)).toBe(false);
  });

  it('should return false if ZoxideEntry has wrong types', () => {
    const invalidData = {
      '/home/user/docs': { count: '5', lastAccess: 123456789 },
    };
    expect(isValidZoxideData(invalidData)).toBe(false);
  });
});
