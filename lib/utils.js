import fetch from 'node-fetch';

/*
 Public API.
 */
export { contentsDiffer } from './utils/contentsDiffer.js';
export { safeRead } from './utils/safeRead.js';
export { safeWrite } from './utils/safeWrite.js';
export { log } from './utils/log.js';
export { logChange } from './utils/logChange.js';
export { logRemoval } from './utils/logRemoval.js';
export { logError } from './utils/logError.js';
export { parameterizeString } from './utils/parameterizeString.js';
export { lowerCaseFirst } from './utils/lowerCaseFirst.js';
export { fetch };
export { normalizePath } from './utils/normalizePath.js';
