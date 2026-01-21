import { ZoxideEntry } from '../types';

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
    if (typeof entry.count !== 'number' || typeof entry.lastAccess !== 'number') {
      return false;
    }

    return true;
  });
}
