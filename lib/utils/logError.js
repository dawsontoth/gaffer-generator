import { log } from './log.js';

/**
 * Logs an error.
 * @param text
 * @param [err]
 */
export function logError(text, err) {
  log(text, err, true);
}
