import { describe, expect, it } from 'vitest';
import { lowerCaseFirst } from './lowerCaseFirst.js';

describe('lowerCaseFirst', () => {
  it('passes non-strings through untouched', () => {
    expect(lowerCaseFirst(2)).toBe(2);
    expect(lowerCaseFirst(null)).toBe(null);
    expect(lowerCaseFirst(false)).toBe(false);
    expect(lowerCaseFirst(undefined)).toBe(undefined);
  });

  it('lowercases the first letter', () => {
    expect(lowerCaseFirst('Hello')).toBe('hello');
  });

  it('does not alter other characters', () => {
    expect(lowerCaseFirst('HellO')).toBe('hellO');
  });

  it('does not alter other words', () => {
    expect(lowerCaseFirst('Hello World')).toBe('hello World');
  });
});
