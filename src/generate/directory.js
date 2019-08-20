const difference = require('lodash.difference');
const path = require('path');
const fs = require('fs');
const globule = require('globule');
const argv = require('yargs').argv;

const utils = require('../utils');
const dryRun = argv.dryRun || false;
const node = require('./node');

/*
 Public API.
 */
exports.visit = visit;

/*
 Implementation.
 */
function visit(items, fromPath, templateSettings) {
  const directoryItems = globule.find('*', {cwd: fromPath});
  if (directoryItems.indexOf('template.js') >= 0) {
    directoryItems.splice(directoryItems.indexOf('template.js'), 1);
  }
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
    const changedDir = path.dirname(changedFiles[0]);
    const allFiles = globule.find('*', {nodir: true, cwd: changedDir, prefixBase: true});
    const obsoleteFiles = difference(allFiles, changedFiles);
    for (let obsoleteFile of obsoleteFiles) {
      utils.logRemoval(obsoleteFile);
      !dryRun && fs.unlinkSync(obsoleteFile);
    }
  }
}
