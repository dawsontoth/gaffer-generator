import colors from 'colors/safe.js';
import { getArgv } from '../argv.js';

/**
 * Logs a message to the console with a nice prefix.
 * @param text The text to write.
 * @param [error] The optional error to log
 * @param writeAsError If we should use console.error or console.log.
 */
export function log(text, error = null, writeAsError = false) {
  if (getArgv().silent) {
    return;
  }
  let prefix = colors.gray(`[${new Date().toTimeString().split(' ')[0]}] `);
  if (writeAsError) {
    if (error) {
      console.error(prefix + text, error);
    }
    else {
      console.error(prefix + text);
    }
  }
  else {
    console.log(prefix + text);
  }
}
