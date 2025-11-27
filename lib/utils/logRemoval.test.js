import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logRemoval } from './logRemoval.js';

vi.mock('colors/safe', () => ({
  default: {
    red: s => s,
    magenta: s => s,
  }
}));

const logSpy = vi.fn();
vi.mock('./log.js', () => ({ log: (...args) => logSpy(...args) }));

describe('logRemoval', () => {
  beforeEach(() => {
    logSpy.mockClear();
  });

  it('logs a removing message with the url', () => {
    logRemoval('/tmp/file.txt');
    expect(logSpy).toHaveBeenCalledTimes(1);
    const msg = logSpy.mock.calls[0][0];
    expect(msg.startsWith('removing: ')).toBe(true);
    expect(msg.endsWith('/tmp/file.txt')).toBe(true);
  });
});
