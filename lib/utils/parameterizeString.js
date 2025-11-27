import get from 'lodash.get';

/**
 * Given a string with _parameters_ within it, substitute them with the real values from the given context.
 * @param str
 * @param context
 * @returns {string}
 */
export function parameterizeString(str, context) {
  return str.replace(
    /_[a-z]*\.?[a-z]+_/ig,
    match => {
      const variableName = match.slice(1, -1);
      return get(context, variableName)
        || get(context, variableName.toLowerCase())
        || get(context, variableName.toUpperCase())
        || match;
    });
}
