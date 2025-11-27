import colors from 'colors/safe.js';
import fs from 'fs';
import path from 'path';
import { log } from './log.js';
import { normalizePath } from './normalizePath.js';

/**
 * If the file doesn't exist, logs a message saying it is being created. Otherwise, it's being updated.
 * @param file
 */
export function logChange(file) {
  let url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  log(colors.cyan(`${fs.existsSync(url) ? 'updating' : 'creating'}: `) + colors.magenta(url));
}
