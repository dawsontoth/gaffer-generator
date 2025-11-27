import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeRead } from './safeRead.js';

// Mocks for fs
vi.mock('fs', () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  return {
    default: { existsSync, readFileSync },
    existsSync,
    readFileSync,
  };
});

// Make normalizePath deterministic and cross-platform
vi.mock('./normalizePath.js', () => ({
  normalizePath: (p) => (p && p.startsWith(path.sep) ? path.resolve(p) : path.normalize(p)),
}));

describe('safeRead', () => {
  beforeEach(() => {
    existsSync.mockReset();
    readFileSync.mockReset();
  });

  it('returns null when file does not exist', () => {
    existsSync.mockReturnValue(false);
    const result = safeRead('does/not/exist.txt');
    expect(result).toBeNull();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('reads and returns contents when file exists (string path)', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('hello');
    const url = path.join('some', 'path', 'file.txt');
    const result = safeRead(url);
    expect(result).toBe('hello');
    expect(readFileSync).toHaveBeenCalledWith(path.normalize(url), 'utf-8');
  });

  it('supports file object with dirname and basename', () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('data');
    const file = { dirname: path.join('a', 'b'), basename: 'c.txt' };
    const result = safeRead(file);
    expect(result).toBe('data');
    expect(readFileSync).toHaveBeenCalledWith(path.join(file.dirname, file.basename), 'utf-8');
  });
});
