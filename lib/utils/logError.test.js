import { describe, expect, it, vi } from 'vitest';
import { logError } from './logError.js';

const logSpy = vi.fn();
vi.mock('./log.js', () => ({ log: (...args) => logSpy(...args) }));

describe('logError', () => {
  it('delegates to log with writeAsError=true', () => {
    const err = new Error('boom');
    logError('bad things', err);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe('bad things');
    expect(logSpy.mock.calls[0][1]).toBe(err);
    expect(logSpy.mock.calls[0][2]).toBe(true);
  });
});
