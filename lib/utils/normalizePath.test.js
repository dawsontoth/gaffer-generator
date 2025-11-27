import path from 'path';
import { describe, expect, it } from 'vitest';
import { normalizePath } from './normalizePath.js';

describe('normalizePath', () => {
  it('normalizes relative paths using Node path.normalize', () => {
    const raw = ['foo', 'bar', '..', 'baz', '.', 'qux'].join(path.sep);
    const expected = path.normalize(raw);
    expect(normalizePath(raw)).toBe(expected);
  });

  it('resolves absolute paths using Node path.resolve', () => {
    const abs = path.join(path.sep, 'tmp', '..', 'x', 'y');
    const expected = path.resolve(abs);
    expect(normalizePath(abs)).toBe(expected);
  });
});
