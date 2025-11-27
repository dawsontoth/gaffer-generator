import colors from 'colors/safe.js';
import defaults from 'lodash.defaults';
import template from 'lodash.template';
import { getArgv } from '../argv.js';
import { templateArgs } from '../templateArgs.js';
import * as utils from '../utils.js';

const dryRun = getArgv().dryRun || false;

/*
 Public API.
 */
export { visit };

/*
 Implementation.
 */
function visit(items, fromPath, toPath, templateSettings, changedFiles) {
  const templateUtils = defaults({}, templateSettings, utils);
  let compiledTemplate;

  try {
    compiledTemplate = template(
      templateUtils.safeRead(fromPath),
      defaults({
        sourceURL: fromPath,
      }, templateSettings.templateArgs || templateArgs),
    );
  }
  catch (err) {
    templateUtils.logError(
      colors.red('Hit error when compiling template:\n')
      + colors.cyan(fromPath),
      err);
    return;
  }

  for (const item of items) {
    try {
      const instanceData = defaults({ utils: templateUtils }, item.context);
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
    }
    catch (err) {
      templateUtils.logError(
        colors.red('Hit error when running template:\n')
        + colors.cyan(fromPath) + colors.gray(' => ') + colors.cyan(item.path),
        err);
    }
  }
}
