import path from 'path';
import { isAbsolute } from './isAbsolute.js';

/**
 * Normalizes a path across platforms. (Root / paths are assumed to be on C:\ on Windows).
 * @param ref
 * @returns {string}
 */
export function normalizePath(ref) {
  return ref && isAbsolute(ref) ? path.resolve(ref) : path.normalize(ref);
}
