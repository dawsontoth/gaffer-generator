require('colors');
const _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  globule = require('globule');

const utils = require('../utils'),
  node = require('./node');

/*
 Public API.
 */
exports.run = run;
exports.visit = visit;

/*
 Implementation.
 */
function run(directory) {
  let matches = globule.find(path.join(directory, '**/*.templateroot'));
  for (const match of matches) {
    visit(path.resolve(match));
  }
}

function visit(rootPath) {
  const templateSettingsPath = path.join(rootPath, 'template.js');
  if (!fs.existsSync(templateSettingsPath)) {
    utils.logError(
      'Found .templateroot without a template.js file:\n'.red
      + templateSettingsPath.cyan);
    return;
  }
  const templateSettings = require(templateSettingsPath);
  if (!templateSettings.into) {
    utils.logError(
      'Found .templateroot that does not have a "into" export in template.js:\n'.red
      + templateSettingsPath.cyan);
    return;
  }
  if (!templateSettings.download) {
    utils.logError(
      'Found .templateroot that does not have a "download" export in template.js:\n'.red
      + templateSettingsPath.cyan);
    return;
  }
  let toPath = path.join(rootPath, templateSettings.into);
  templateSettings.download()
    .catch(err => {
      utils.logError(
        'Hit error when downloading for .templateroot:\n'.red
        + templateSettingsPath.cyan + '\n'
        + err);
    })
    .then(json => node.visit(json, rootPath, toPath, templateSettings));
}
