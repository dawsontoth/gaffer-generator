import fs from 'fs';
import globule from 'globule';
import path from 'path';
import { getArgv } from '../argv.js';
import * as utils from '../utils.js';
import { logRemoval } from '../utils/logRemoval.js';
import * as node from './node.js';
import difference from 'lodash.difference';
import uniq from 'lodash.uniq';

const dryRun = getArgv().dryRun || false;
const reservedItems = ['template.cjs', 'template.js', 'template.mjs', 'template.ts', 'template', '.DS_Store'];

/*
 Public API.
 */
export { visit };

/*
 Implementation.
 */
function visit(items, fromPath, templateSettings) {
  const directoryItems = globule.find('*', { cwd: fromPath, dot: true })
    .filter(i => reservedItems.indexOf(i) === -1);
  const changedFiles = [];
  for (const item of items) {
    for (const directoryItem of directoryItems) {
      node.visit(
        item.context,
        path.join(fromPath, directoryItem), path.join(item.path, directoryItem),
        templateSettings,
        changedFiles);
    }
  }
  !templateSettings.skipCleaning && cleanDirectory(changedFiles);
}

function cleanDirectory(changedFiles) {
  if (changedFiles.length) {
    const changedDirs = uniq(changedFiles.map(path.dirname));
    changedDirs.forEach(changedDir => {
      const allFiles = globule.find('*', {
        nodir: true,
        cwd: changedDir,
        prefixBase: true,
        dot: true,
      }).map(utils.normalizePath);
      const obsoleteFiles = difference(allFiles, changedFiles.map(utils.normalizePath));
      for (let obsoleteFile of obsoleteFiles) {
        logRemoval(obsoleteFile);
        !dryRun && fs.unlinkSync(obsoleteFile);
      }
    });
  }
}
