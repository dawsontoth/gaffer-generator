import { describe, expect, it } from 'vitest';
import { normalizeLineEndings } from './normalizeLineEndings.js';

describe('normalizeLineEndings', () => {
  it('converts CRLF and CR to LF', () => {
    expect(normalizeLineEndings('a\r\nb\r\nc')).toBe('a\nb\nc');
    expect(normalizeLineEndings('a\rb\rc')).toBe('a\nb\nc');
  });

  it('leaves LF-only content as-is', () => {
    expect(normalizeLineEndings('a\nb\nc')).toBe('a\nb\nc');
  });
});
