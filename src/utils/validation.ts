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

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Keys must be strings (implicitly true for Object.entries on non-symbol keys)
    // Values must be objects matching ZoxideEntry
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const entry = value as Record<string, unknown>;
    if (typeof entry.count !== 'number' || typeof entry.lastAccess !== 'number') {
      return false;
    }
  }

  return true;
}
