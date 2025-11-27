import { existsSync } from 'fs';
// Use real path but mock normalizePath to be deterministic passthrough of path.normalize
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logChange } from './logChange.js';

vi.mock('colors/safe', () => ({
  default: {
    cyan: s => s,
    magenta: s => s,
  }
}));

// Mock fs.existsSync behavior toggled per test
vi.mock('fs', () => {
  const existsSync = vi.fn();
  return {
    default: { existsSync },
    existsSync,
  };
});

vi.mock('./normalizePath.js', () => ({
  normalizePath: (p) => (p && p.startsWith(path.sep) ? path.resolve(p) : path.normalize(p)),
}));

// Spy log function that logChange delegates to
const logSpy = vi.fn();
vi.mock('./log.js', () => ({ log: (...args) => logSpy(...args) }));

describe('logChange', () => {
  beforeEach(() => {
    logSpy.mockClear();
    existsSync.mockReset();
  });

  it('logs creating for non-existing file (string path)', () => {
    existsSync.mockReturnValue(false);
    const url = ['some', 'dir', 'file.txt'].join(path.sep);
    logChange(url);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const msg = logSpy.mock.calls[0][0];
    expect(msg.startsWith('creating: ')).toBe(true);
    expect(msg.endsWith(path.normalize(url))).toBe(true);
  });

  it('logs updating for existing file (object path)', () => {
    existsSync.mockReturnValue(true);
    const file = { dirname: ['a', 'b'].join(path.sep), basename: 'c.txt' };
    logChange(file);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const msg = logSpy.mock.calls[0][0];
    expect(msg.startsWith('updating: ')).toBe(true);
    expect(msg.endsWith(path.join(file.dirname, file.basename))).toBe(true);
  });
});
