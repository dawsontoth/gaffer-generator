require('colors');
const _ = require('lodash'),
  argv = require('yargs').argv;

const utils = require('../utils'),
  dryRun = argv.dryRun || false;

/*
 Public API.
 */
exports.visit = visit;

/*
 Implementation.
 */
function visit(items, fromPath, toPath, templateSettings, changedFiles) {
  const templateUtils = _.defaults({}, templateSettings, utils);
  let template;

  try {
    template = _.template(
      templateUtils.safeRead(fromPath),
      templateSettings.templateArgs || require('../templateArgs'),
    );
  }
  catch (err) {
    templateUtils.logError(
      'Hit error when compiling template:\n'.red
      + String(fromPath).cyan + '\n'
      + err);
    return;
  }

  for (const item of items) {
    try {
      const instanceData = _.defaults({ utils: templateUtils }, item.context);
      const existingContents = templateUtils.safeRead(item.path);
      let newContents = template(instanceData);
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
    }
    catch (err) {
      templateUtils.logError(
        'Hit error when running template:\n'.red
        + fromPath.cyan + ' => '.gray + item.path.cyan + '\n'
        + err);
    }
  }
}
