/**
 * Lowers the first letter of the provided string, leaving the rest of it alone.
 * @param val
 * @returns {string}
 */
export function lowerCaseFirst(val) {
  if (!val || !val.toLowerCase) {
    return val;
  }
  return val[0].toLowerCase() + val.slice(1);
}
