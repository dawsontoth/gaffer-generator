import { normalizeLineEndings } from './normalizeLineEndings.js';

/**
 * Look at two strings to see if they contain the same content, ignoring line endings.
 * @param a
 * @param b
 * @returns {boolean}
 */
export function contentsDiffer(a, b) {
  // Are a and b both empty?
  if (!a && !b) {
    return false;
  }
  // Is only one of them empty?
  if (!a || !b) {
    return true;
  }
  // Otherwise, compare them while ignoring line endings to see if they're equivalent.
  return normalizeLineEndings(a) !== normalizeLineEndings(b);
}
