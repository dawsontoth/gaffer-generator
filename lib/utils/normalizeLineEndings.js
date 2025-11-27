/**
 * Normalizes line endings for comparison purposes.
 * @param contents
 * @returns {string}
 */
export function normalizeLineEndings(contents) {
  return contents.replace(/\r\n?/g, '\n');
}
