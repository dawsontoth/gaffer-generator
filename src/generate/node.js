require('colors');
const defaults = require('lodash.defaults');
const fs = require('fs');

const utils = require('../utils');
const directory = require('./directory');
const file = require('./file');

/*
 Public API.
 */
exports.visit = visit;

/*
 Implementation.
 */
function visit(context, fromPath, toPath, templateSettings, changedFiles) {
  const stat = fs.lstatSync(fromPath);
  const items = findArrayIterationInPath(context, toPath);
  if (stat.isDirectory()) {
    directory.visit(items, fromPath, templateSettings);
  } else if (stat.isFile()) {
    file.visit(items, fromPath, toPath, templateSettings, changedFiles);
  }
}

function findArrayIterationInPath(context, itemPath) {
  const match = itemPath.match(/_each([A-Z][a-z]+)/);
  const type = match && match[1];
  return (type && context[type.toLowerCase() + 's'] || [context])
    .map(item => {
      return {
        context: type ? defaults({[type]: item}, item, context) : context,
        path: utils.parameterizeString(
          itemPath
            .replace(/_each[A-Z][A-Za-z]+\./, '_')
            .replace(/\.templateroot$/, ''),
          item),
      };
    });
}
