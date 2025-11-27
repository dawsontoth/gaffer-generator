import fs from 'fs';
import path from 'path';
import { normalizePath } from './normalizePath.js';

/**
 * Attempts to read in the provided file, returning the string contents if it exists, or null.
 * @param file
 * @returns {string}
 */
export function safeRead(file) {
  let url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  return fs.existsSync(url)
    ? fs.readFileSync(url, 'utf-8')
    : null;
}
