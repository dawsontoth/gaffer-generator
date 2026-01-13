import { describe, expect, it } from 'vitest';
import { isAbsolute } from './isAbsolute.js';

describe('isAbsolute', () => {
  it('returns true for Unix absolute paths', () => {
    expect(isAbsolute('/foo/bar')).toBe(true);
    expect(isAbsolute('/usr/local/bin')).toBe(true);
    expect(isAbsolute('/')).toBe(true);
    expect(isAbsolute('\\')).toBe(true);
    expect(isAbsolute('\\foo\\bar')).toBe(true);
  });

  it('returns true for Windows absolute paths with backslashes', () => {
    expect(isAbsolute('C:\\foo\\bar')).toBe(true);
    expect(isAbsolute('z:\\temp')).toBe(true);
    expect(isAbsolute('D:\\')).toBe(true);
  });

  it('returns false for relative paths', () => {
    expect(isAbsolute('foo/bar')).toBe(false);
    expect(isAbsolute('./foo')).toBe(false);
    expect(isAbsolute('../bar')).toBe(false);
    expect(isAbsolute('temp')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAbsolute('')).toBe(false);
  });

  it('returns true for Windows-like absolute paths with forward slashes', () => {
    expect(isAbsolute('C:/foo/bar')).toBe(true);
  });
});
