const path = require('path'),
  fs = require('fs');

// Download (or fake-download) the necessary metadata:
exports.download = () => new Promise(resolve => resolve(require('../sample.json')))
  .then(json => createFileNames(json));
// or: require('node-fetch').fetch('https://some-api.com/swagger')
//   .then(res => res.json()),

// Set the target directory:
exports.into = '../sample.output/';

// Customize the templates (if desired):
// exports.templateArgs = {
//   evaluate: /(?:\/\*_|<#)([\s\S]+?)(?:_\*\/|#>)/g,
//   escape: /(?:\/\*_|<#)-([\s\S]+?)(?:_\*\/|#>)/g,
//   interpolate: /(?:\/\*_|<#)=([\s\S]+?)(?:_\*\/|#>)/g,
// };

// Map the generated code one last time for clean-up:
exports.mapContents = mapContents;

// That's it, you're all configured!
// Everything below will be used by the templates to maintain your fancy new code.

/*
 Metadata types (not relevant for Swagger).
 */
let MetaTypes = {
    Model: 0,
    Enum: 1,
    Object: 2,
    Array: 3,
    Dictionary: 4,
    Boolean: 5,
    Number: 6,
    String: 7,
  },
  MetaParameterSource = {
    Body: 0,
    Uri: 1,
    Query: 2,
  },
  MetaNumberFormat = {
    Byte: 0,
    SByte: 1,
    Int16: 2,
    UInt16: 3,
    Int32: 4,
    UInt32: 5,
    Int64: 6,
    UInt64: 7,
    Float: 8,
    Double: 9,
    Decimal: 10,
  },
  MetaStringFormat = {
    String: 0,
    Byte: 1,
    DateTime: 2,
    UUID: 3,
  },
  MetaHttpMethod = {
    Post: 0,
    Get: 1,
    Put: 2,
    Delete: 3,
    Head: 4,
    Options: 5,
  };

/*
 Utilities for template.
 */
exports.parseType = parseType;
exports.copyProperties = copyProperties;
exports.fromJSON = fromJSON;
exports.httpMethodToString = httpMethodToString;
exports.parseParams = parseParams;
exports.parsePath = parsePath;
exports.protectPath = protectPath;
exports.outputQuery = outputQuery;
exports.outputBody = outputBody;
exports.lowerCaseFirst = lowerCaseFirst;
exports.translateReserved = translateReserved;
exports.hasParams = hasParams;
exports.hasRequiredParams = hasRequiredParams;
exports.enableCaching = enableCaching;
exports.isString = isString;
exports.toFileName = toFileName;
exports.customExists = customExists;
exports.handleBase = handleBase;
exports.MetaTypes = MetaTypes;
exports.MetaStringFormat = MetaStringFormat;

/*
 Implementation.
 */
function parseType(def) {
  return typeToString(def.type || def);
}

function typeToString(type) {
  // type = something like {
  //   "typeId": 0,
  //   "nullable": false,
  //   "name": "AddressType"
  // }
  return `${typeToStringInner(type)}`;
}

function typeToStringInner(type) {
  switch (type.typeId) {
    case MetaTypes.Model:
    case MetaTypes.Enum:
      return type.name;
    case MetaTypes.Object:
      return 'any';
    case MetaTypes.Array:
      return `${typeToString(type.of)}[]`;
    case MetaTypes.Dictionary:
      return `{ [p:${typeToString(type.keyType)}]: ${typeToString(type.valueType)} }`;
    case MetaTypes.Boolean:
      return 'boolean';
    case MetaTypes.Number:
      switch (type.formatId) {
        case MetaNumberFormat.Byte:
          return 'byte';
        case MetaNumberFormat.SByte:
          return 'sbyte';
        case MetaNumberFormat.Int16:
        case MetaNumberFormat.UInt16:
        case MetaNumberFormat.Int32:
        case MetaNumberFormat.UInt32:
        case MetaNumberFormat.Int64:
        case MetaNumberFormat.UInt64:
        case MetaNumberFormat.Float:
        case MetaNumberFormat.Double:
        case MetaNumberFormat.Decimal:
          return 'number';
        default:
          console.error(type);
          throw new Error('Encountered unhandled property type number format id in typeToStringInner: ' + type.formatId);
      }
    case MetaTypes.String:
      switch (type.formatId) {
        case MetaStringFormat.String:
          return 'string';
        case MetaStringFormat.Byte:
          return 'byte';
        case MetaStringFormat.DateTime:
          return 'string';
        case MetaStringFormat.UUID:
          return 'string';
        default:
          console.error(type);
          throw new Error('Encountered unhandled property type string format id in typeToStringInner: ' + type.formatId);
      }
    default:
      console.error(type);
      throw new Error('Encountered unhandled property type id in typeToStringInner: ' + type.typeId);
  }
}

function copyProperties(propertyName, type, depth) {
  let key = lowerCaseFirst(propertyName),
    directAssignment = 'to.' + key + ' = from.' + key;
  switch (type.typeId) {
    case MetaTypes.Model:
      return 'to.' + key + ' = new ' + type.name + '(from.' + key + ');';
    case MetaTypes.Enum:
      return directAssignment + ' as ' + type.name + ';';
    case MetaTypes.Array:
      if (type.of.typeId === MetaTypes.Model) {
        return directAssignment + '.map(\n' + depthToTabs(depth) + '\tinstance => new ' + type.of.name + '(instance));';
      }
      return directAssignment + '.slice() as ' + typeToString(type.of) + '[];';
    case MetaTypes.Dictionary:
      return copyDictionaryProperties(key, type.valueType, depth || 1);
    default:
      return directAssignment + ' as ' + typeToString(type) + ';';
  }
}

function copyDictionaryProperties(key, valueType, depth) {
  return tabify([
    'to.' + key + ' = Object.assign({}, from.' + key + ');',
    'for (let key' + depth + ' in from.' + key + ') {',
    '\tif (from.' + key + '.hasOwnProperty(key' + depth + ')) {',
    '\t\t' + copyProperties(key + '[key' + depth + ']', valueType, depth + 1),
    '\t}',
    '}',
  ], depthToTabs(depth));
}

function depthToTabs(depth) {
  let tabs = '\t\t\t';
  for (let i = 1; i < depth; i++) {
    tabs += '\t\t';
  }
  return tabs;
}

function fromJSON(type, key) {
  if (!key) {
    key = 'json';
  }

  switch (type.typeId) {
    case MetaTypes.Model:
      return type.name + '.fromJSON(' + key + ')';
    case MetaTypes.Enum:
      return key + ' as ' + type.name;
    case MetaTypes.Array:
      if (type.of.typeId === MetaTypes.Model) {
        return key + '.map(' + type.of.name + '.fromJSON)';
      }
      return key + ' as ' + typeToString(type.of) + '[]';
    case MetaTypes.Dictionary:
      return copyDictionaryProperties(key, type.valueType, 1);
    default:
      return key + ' as ' + typeToString(type);
  }

}

function toJSON(type, key) {
  if (!key) {
    key = 'this';
  }

  switch (type.typeId) {
    case MetaTypes.Model:
      return key + '.toJSON()';
    case MetaTypes.Enum:
      return key;
    case MetaTypes.Array:
      if (type.of.typeId === MetaTypes.Model) {
        return key + '.map(item => item.toJSON())';
      }
      return key;
    case MetaTypes.Dictionary:
      return key;
    default:
      return key;
  }
}

function httpMethodToString(method) {
  return Object.keys(MetaHttpMethod)[method.httpMethodId].toUpperCase();
}

function parseParams(params) {
  if (!params) {
    return '';
  }
  return '\n\t' + params
    .map(function(param) {
      if (!param.type) {
        console.log('WARNING: Parameter without a type found:');
        console.log(param);
        console.trace();
      }
      return param.name.replace(/\./g, '_') + (param.optional ? '?' : '') + ':' + typeToString(param.type);
    })
    .join(';\n\t') + ';\n';
}

function parsePath(method) {
  let path = method.path;
  return path.replace(/\{([^}]+)}/g, (match, name) => '${args.' + name + '}');
}

function protectPath(method) {
  let path = method.path,
    retVal = [],
    matches = path.match(/\{([^}]+)}/g) || [];
  for (let i = 0; i < matches.length; i++) {
    let match = matches[i].slice(1, -1),
      param = method.parameters.find(param => param.name === match);
    if (param) {
      retVal.push('\n\t\tif (args.' + param.name + ' === undefined || args.' + param.name + ' === null) {\n\t\t\targs.' + param.name + ' = <any>\'\';\n\t\t}');
    }
  }
  return retVal.join('');
}

function outputQuery(params) {
  let queryParams = params.find(param => param.sourceId === MetaParameterSource.Query);
  if (!queryParams || !queryParams.length) {
    return '';
  }
  let retVal = '\n\t\tlet qp = [];';
  for (let i = 0; i < queryParams.length; i++) {
    let param = queryParams[i];
    retVal += '\n\t\tif (IsSpecified(args.' + param.name.replace(/\./g, '_') + ')) {' +
      '\n\t\t\tqp.push(\'' + param.name + '=\'\n\t\t\t\t+ encodeURIComponent(String(args.' + param.name.replace(/\./g, '_') + ')));' +
      '\n\t\t}';
  }
  retVal += '\n\t\tif (qp.length) {';
  retVal += '\n\t\t\turl += \'?\' + qp.join(\'&\');';
  retVal += '\n\t\t}';
  return retVal;
}

function outputBody(method) {
  let bodyParam = method.parameters.find(parameter => parameter.sourceId === MetaParameterSource.Body),
    requiresBody = [MetaHttpMethod.Post, MetaHttpMethod.Put].indexOf(method.httpMethodId) >= 0,
    prefix = '\n\t\t\t\tbody: ';

  if (!bodyParam) {
    return requiresBody ? prefix + '\'{}\',' : null;
  }
  return prefix + 'JSON.stringify(args.' + toJSON(bodyParam.type, bodyParam.name) + '),';
}

function lowerCaseFirst(val) {
  if (!val || !val.toLowerCase) {
    return val;
  }
  return val[0].toLowerCase() + val.substr(1);
}

function translateReserved(name) {
  switch (name) {
    case 'delete':
      return 'remove';
    case 'new':
      return 'blank';
    case 'switch':
      return 'change';
    default:
      return name;
  }
}

function hasParams(m) {
  return m.parameters && m.parameters.length;
}

function hasRequiredParams(m) {
  if (!m || !m.parameters || !m.parameters.length) {
    return false;
  }
  return m.parameters
    .filter(function(param) {
      return !param.optional;
    })
    .length > 0;
}

function tabify(lines, tabs) {
  return lines.join('\n' + tabs);
}

function enableCaching(serviceName, methodName) {
  // TODO: caching is usually a good candidate for configuration, then generation.
  return false;
}

function isString(param) {
  return param && param.typeId === MetaTypes.String;
}

function createFileNames(sdk) {
  ['controllers', 'models', 'enums'].forEach(type => {
    sdk[type].forEach(instance => {
      instance.fileName = toFileName(instance.name);
      if (type === 'controllers') {
        instance.fileName += '.service';
      }
    });
  });
  return sdk;
}

function toFileName(name) {
  return lowerCaseFirst(name)
    .replace(/[a-z][A-Z]/g, letters => letters[0] + '-' + letters[1].toLowerCase())
    .toLowerCase();
}

function mapContents(newContents, instanceData, item) {
  return cleanUpImports(newContents);
}

function cleanUpImports(str) {
  return str
    .replace(/import {\s*([^,\s}]+)\s*}[^;]+;\r?\n/g, (val, ns) =>
      str.match(new RegExp('[^a-zA-Z]' + ns + '[^a-zA-Z]', 'g')).length <= 1 ? '' : val)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

let customExistsHash = {};

function customExists(Model) {
  const ref = path.resolve(
    path.join(
      __dirname,
      exports.into,
      'custom',
      Model.fileName + '.ts',
    ),
  );
  return customExistsHash[ref] !== undefined
    ? customExistsHash[ref]
    : customExistsHash[ref] = fs.existsSync(ref);
}

function handleBase(Model) {
  return Model.name + (customExists(Model) ? 'Base' : '');
}
