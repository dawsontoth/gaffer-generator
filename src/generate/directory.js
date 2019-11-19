const _ = require('../lodash');
const difference = _.difference;
const uniq = _.uniq;
const path = require('path');
const fs = require('fs');
const globule = require('globule');
const argv = require('yargs').argv;

const utils = require('../utils');
const dryRun = argv.dryRun || false;
const node = require('./node');

const reservedItems = ['template.js', 'template.ts', 'template'];

/*
 Public API.
 */
exports.visit = visit;

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
        utils.logRemoval(obsoleteFile);
        !dryRun && fs.unlinkSync(obsoleteFile);
      }
    });
  }
}
