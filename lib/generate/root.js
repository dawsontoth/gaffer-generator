import colors from 'colors/safe.js';
import fs from 'fs';
import globule from 'globule';
import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';
import { getArgv } from '../argv.js';
import * as utils from '../utils.js';
import { isAbsolute } from '../utils/isAbsolute.js';
import { logError } from '../utils/logError.js';
import * as node from './node.js';

// Create a CommonJS-compatible require that works from ESM context
const requireCompat = createRequire(import.meta.url);

/*
 Public API.
 */
export { run, visit };

/*
 Implementation.
 */
async function run(directory) {
  const matches = globule.find({
    src: path.join(directory, '**/*.templateroot'),
    filter: match => match.indexOf('node_modules') === -1,
    dot: true,
  });
  for (const match of matches) {
    await visit(path.resolve(match));
  }
}

async function visit(rootPath) {
  const templateSettingsPath = determineTemplateFile(rootPath);
  if (!templateSettingsPath) {
    logError(
      colors.red('Found .templateroot without a template.cjs, template.mjs, template.js or template.ts file:\n')
      + colors.cyan(rootPath));
    return;
  }
  const templateSettings = await import(pathToFileURL(templateSettingsPath).href);

  if (getArgv().into) {
    templateSettings.into = getArgv().into;
  }
  if (!templateSettings.into) {
    logError(
      colors.red('Found .templateroot that does not have a "into" export in template file:\n')
      + colors.cyan(templateSettingsPath));
    return;
  }
  if (!templateSettings.download) {
    logError(
      colors.red('Found .templateroot that does not have a "download" export in template file:\n')
      + colors.cyan(templateSettingsPath));
    return;
  }
  const toPath = isAbsolute(templateSettings.into[0]) ? templateSettings.into : path.join(rootPath, templateSettings.into);
  utils.log(colors.green('Running download from ') + colors.magenta(templateSettingsPath));
  templateSettings.download(utils.fetch)
    .catch(err => {
      logError(
        colors.red('Hit error when downloading for .templateroot:\n')
        + colors.cyan(templateSettingsPath),
        err);
    })
    .then(json => json && node.visit(json, rootPath, toPath, templateSettings));
}

function determineTemplateFile(rootPath) {
  const cjsTemplate = path.join(rootPath, 'template.cjs');
  const jsTemplate = path.join(rootPath, 'template.js');
  const mjsTemplate = path.join(rootPath, 'template.mjs');
  const tsTemplate = path.join(rootPath, 'template.ts');
  if (fs.existsSync(cjsTemplate)) {
    return cjsTemplate;
  }
  if (fs.existsSync(mjsTemplate)) {
    return mjsTemplate;
  }
  if (fs.existsSync(jsTemplate)) {
    return jsTemplate;
  }
  if (fs.existsSync(tsTemplate)) {
    try {
      requireCompat('ts-node').register();
    }
    catch (err) {
      console.warn(colors.gray('Detected template.ts, but ts-node failed to register:'), err);
    }
    return tsTemplate;
  }
  return null;
}
