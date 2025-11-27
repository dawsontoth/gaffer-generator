import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeWrite } from './safeWrite.js';

// fs mocks
vi.mock('fs', () => {
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  return {
    default: { existsSync, mkdirSync, writeFileSync },
    existsSync,
    mkdirSync,
    writeFileSync,
  };
});

// normalizePath mock: normalize or resolve for absolute
vi.mock('./normalizePath.js', () => ({
  normalizePath: (p) => (p && p.startsWith(path.sep) ? path.resolve(p) : path.normalize(p)),
}));

describe('safeWrite', () => {
  beforeEach(() => {
    existsSync.mockReset();
    mkdirSync.mockReset();
    writeFileSync.mockReset();
  });

  it('creates intermediate directories when missing (relative path)', () => {
    const url = path.join('a', 'b', 'c', 'file.txt');
    // dirs = ['a','b','c'] -> checks 'a' then 'a/b'
    existsSync
      .mockReturnValueOnce(false) // 'a/b'
      .mockReturnValueOnce(false); // 'a/b/c'
    safeWrite(url, 'data');
    expect(mkdirSync).toHaveBeenCalledTimes(2);
    expect(mkdirSync).toHaveBeenNthCalledWith(1, path.join('a', 'b'));
    expect(mkdirSync).toHaveBeenNthCalledWith(2, path.join('a', 'b', 'c'));
    expect(writeFileSync).toHaveBeenCalledWith(path.normalize(url), 'data', 'utf-8');
  });

  it('does not create directories when they already exist', () => {
    const url = path.join('x', 'y', 'z', 'f.txt');
    existsSync
      .mockReturnValueOnce(true) // 'x'
      .mockReturnValueOnce(true); // 'x/y'
    safeWrite(url, 'text');
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalledWith(path.normalize(url), 'text', 'utf-8');
  });

  it('supports file object with dirname and basename', () => {
    const file = { dirname: path.join('root', 'sub'), basename: 'file.txt' };
    // dirs = ['root','sub'] -> checks only 'root'
    existsSync.mockReturnValueOnce(true);
    safeWrite(file, 'obj');
    expect(writeFileSync).toHaveBeenCalledWith(path.join(file.dirname, file.basename), 'obj', 'utf-8');
  });
});
