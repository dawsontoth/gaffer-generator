require('colors');
const copy = require('recursive-copy'),
  path = require('path'),
  argv = require('yargs').argv;

const utils = require('./utils'),
  dryRun = argv.dryRun || false;

/*
 Public API.
 */
exports.run = run;

/*
 Implementation.
 */
function run(directory) {
  const from = path.join(__dirname, '..', 'example', 'sample.templateroot');
  const to = directory;
  const options = {
    overwrite: argv.overwrite,
  };
  utils.logChange(to);
  if (dryRun) {
    return;
  }
  copy(from, to, options)
    .on(copy.events.ERROR, (error, copyOperation) => {
      utils.logError('Unable to copy to '.red + copyOperation.dest.magenta);
    })
    .then(results => {
      utils.log(results.length + ' file(s) copied');
    })
    .catch(function(error) {
      utils.logError(String(error).red);
      process.exit(1);
    });
}
