import { ZoxideEntry } from '../types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates that the input is a Record<string, ZoxideEntry>.
 *
 * Expected structure:
 * {
 *   "/some/path": { count: number, lastAccess: number },
 *   ...
 * }
 */
export function isValidZoxideData(data: unknown): data is Record<string, ZoxideEntry> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }

  return Object.values(data as Record<string, unknown>).every((value) => {
    // Values must be objects matching ZoxideEntry
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const entry = value as Record<string, unknown>;
    // Number.isFinite also rejects non-numbers; guards NaN/Infinity, which
    // typeof 'number' would let through this trust-boundary validator.
    if (!Number.isFinite(entry.count) || !Number.isFinite(entry.lastAccess)) {
      return false;
    }

    return true;
  });
}
