import { describe, expect, it } from 'vitest';
import { contentsDiffer } from './contentsDiffer.js';

describe('contentsDiffer', () => {
  it('returns false when both are empty/falsy', () => {
    expect(contentsDiffer('', '')).toBe(false);
    expect(contentsDiffer(null, undefined)).toBe(false);
    expect(contentsDiffer(undefined, null)).toBe(false);
    expect(contentsDiffer('', null)).toBe(false);
  });

  it('returns true when one is empty/falsy and the other is not', () => {
    expect(contentsDiffer('', 'a')).toBe(true);
    expect(contentsDiffer('a', '')).toBe(true);
    expect(contentsDiffer(undefined, 'a')).toBe(true);
    expect(contentsDiffer('a', null)).toBe(true);
  });

  it('ignores differences in line endings', () => {
    expect(contentsDiffer('a\r\nb', 'a\nb')).toBe(false);
    expect(contentsDiffer('a\rb', 'a\nb')).toBe(false);
  });

  it('detects actual content differences', () => {
    expect(contentsDiffer('a\nb', 'a\nc')).toBe(true);
  });
});
