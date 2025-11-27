import colors from 'colors/safe.js';
import { log } from './log.js';

/**
 * Logs a message saying the file is being removed.
 * @param url
 */
export function logRemoval(url) {
  log(colors.red(`removing: `) + colors.magenta(url));
}
