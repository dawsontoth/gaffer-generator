import fs from 'fs';
import path from 'path';
import { normalizePath } from './normalizePath.js';

/**
 * Writes the contents to the file, making sure the parent directories of the file exist.
 * @param file
 * @param contents
 */
export function safeWrite(file, contents) {
  const url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  const dirs = url.split(path.sep).slice(0, -1);
  // Note: we start at 1 to avoid trying to create the root directory.
  for (let i = 1; i < dirs.length; i++) {
    let collectivePath = dirs.slice(0, i + 1).join(path.sep);
    if (!fs.existsSync(collectivePath)) {
      fs.mkdirSync(collectivePath);
    }
  }
  fs.writeFileSync(url, contents, 'utf-8');
}
