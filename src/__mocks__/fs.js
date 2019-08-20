const path = require('path');

/*
 Testing utility API.
 */
const fs = jest.genMockFromModule('fs');
const responses = {};
let mockFiles = {};
fs.__setMockFiles = __setMockFiles;
fs.__setResponse = __setResponse;
fs.__spy = {};
const mockedMethods = [
  'existsSync',
  'readFileSync',
  'writeFileSync',
  'mkdirSync',
];

/*
 Mocked API.
 */
fs.readdirSync = readdirSync;
for (const mockedMethod of mockedMethods) {
  fs[mockedMethod] = respond(mockedMethod);
  fs.__spy[mockedMethod] = jest.spyOn(fs, mockedMethod);
}

module.exports = fs;

/*
 Implementation.
 */

function __setMockFiles(newMockFiles) {
  mockFiles = {};
  for (const file of newMockFiles) {
    const dir = path.dirname(file);
    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}

function __setResponse(method, val) {
  responses[method] = val;
}

function readdirSync(directoryPath) {
  return mockFiles[directoryPath] || [];
}

function respond(method) {
  return () => {
    if (responses[method] !== undefined) {
      return responses[method];
    }
  };
}
