require('colors');
const fs = require('fs');
const globule = require('globule');
const path = require('path');
const argv = require('yargs').argv;

const utils = require('../utils');
const node = require('./node');

/*
 Public API.
 */
exports.run = run;
exports.visit = visit;

/*
 Implementation.
 */
function run(directory) {
  const matches = globule.find({
    src: path.join(directory, '**/*.templateroot'),
    filter: match => match.indexOf('node_modules') === -1,
    dot: true,
  });
  for (const match of matches) {
    visit(path.resolve(match));
  }
}

function visit(rootPath) {
  const templateSettingsPath = determineTemplateFile(rootPath);
  if (!templateSettingsPath) {
    utils.logError(
      'Found .templateroot without a template.js or template.ts file:\n'.red
      + rootPath.cyan);
    return;
  }
  const templateSettings = require(templateSettingsPath);
  if (argv.into) {
    templateSettings.into = argv.into;
  }
  if (!templateSettings.into) {
    utils.logError(
      'Found .templateroot that does not have a "into" export in template file:\n'.red
      + templateSettingsPath.cyan);
    return;
  }
  if (!templateSettings.download) {
    utils.logError(
      'Found .templateroot that does not have a "download" export in template file:\n'.red
      + templateSettingsPath.cyan);
    return;
  }
  const toPath = templateSettings.into[0] === '/' ? templateSettings.into : path.join(rootPath, templateSettings.into);
  utils.log('Running download from '.green + templateSettingsPath.magenta);
  templateSettings.download(utils.fetch)
    .catch(err => {
      utils.logError(
        'Hit error when downloading for .templateroot:\n'.red
        + templateSettingsPath.cyan,
        err);
    })
    .then(json => json && node.visit(json, rootPath, toPath, templateSettings));
}

function determineTemplateFile(rootPath) {
  const cjsTemplate = path.join(rootPath, 'template.cjs');
  const jsTemplate = path.join(rootPath, 'template.js');
  const tsTemplate = path.join(rootPath, 'template.ts');
  if (fs.existsSync(cjsTemplate)) {
    return cjsTemplate;
  }
  if (fs.existsSync(jsTemplate)) {
    return jsTemplate;
  }
  if (fs.existsSync(tsTemplate)) {
    try {
      require('ts-node').register();
    }
    catch (err) {
      console.warn('Detected template.ts, but ts-node failed to register:', err);
    }
    return tsTemplate;
  }
  return null;
}
