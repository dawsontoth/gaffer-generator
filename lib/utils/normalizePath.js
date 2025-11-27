import path from 'path';

/**
 * Normalizes a path across platforms. (Root / paths are assumed to be on C:\ on windows).
 * @param ref
 * @returns {string}
 */
export function normalizePath(ref) {
  return ref && ref.startsWith('/') ? path.resolve(ref) : path.normalize(ref);
}
