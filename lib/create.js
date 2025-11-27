import colors from 'colors/safe.js';
import path from 'path';
import copy from 'recursive-copy';
import { getArgv } from './argv.js';
import * as utils from './utils.js';
import { logChange } from './utils/logChange.js';
import { logError } from './utils/logError.js';

const dryRun = getArgv().dryRun || false;

/*
 Public API.
 */
export { run };

/*
 Implementation.
 */
function run(directory) {
  const from = path.join(import.meta.dirname, '..', 'example', 'sample.templateroot');
  const to = directory;
  const options = {
    overwrite: getArgv().overwrite,
  };
  logChange(to);
  if (dryRun) {
    return;
  }
  copy(from, to, options)
    .on(copy.events.ERROR, (error, copyOperation) => {
      logError(colors.red('Unable to copy to ') + colors.magenta(copyOperation.dest));
    })
    .then(results => {
      utils.log(results.length + ' file(s) copied');
    })
    .catch(function(error) {
      logError(colors.red(error));
      process.exit(1);
    });
}
