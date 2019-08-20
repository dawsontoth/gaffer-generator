require('colors');
const defaults = require('lodash.defaults');
const template = require('lodash.template');
const argv = require('yargs').argv;

const utils = require('../utils');
const dryRun = argv.dryRun || false;

/*
 Public API.
 */
exports.visit = visit;

/*
 Implementation.
 */
function visit(items, fromPath, toPath, templateSettings, changedFiles) {
  const templateUtils = defaults({}, templateSettings, utils);
  let compiledTemplate;

  try {
    compiledTemplate = template(
      templateUtils.safeRead(fromPath),
      templateSettings.templateArgs || require('../templateArgs'),
    );
  } catch (err) {
    templateUtils.logError(
      'Hit error when compiling template:\n'.red
      + String(fromPath).cyan + '\n'
      + err);
    return;
  }

  for (const item of items) {
    try {
      const instanceData = defaults({utils: templateUtils}, item.context);
      const existingContents = templateUtils.safeRead(item.path);
      let newContents = compiledTemplate(instanceData);
      if (templateUtils.mapContents) {
        newContents = templateUtils.mapContents(newContents, instanceData, item);
      }
      if (newContents) {
        changedFiles.push(item.path);
        if (templateUtils.contentsDiffer(existingContents, newContents)) {
          templateUtils.logChange(item.path);
          !dryRun && templateUtils.safeWrite(item.path, newContents);
        }
      }
    } catch (err) {
      templateUtils.logError(
        'Hit error when running template:\n'.red
        + fromPath.cyan + ' => '.gray + item.path.cyan + '\n'
        + err);
    }
  }
}
