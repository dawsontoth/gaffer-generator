import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setArgv } from '../argv.js';
import { log } from './log.js';

vi.mock('colors/safe', () => ({
  default: {
    gray: s => s,
    cyan: s => s,
    magenta: s => s,
    red: s => s,
  },
}));

describe('log', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    // Set to 01:02:03 local time deterministically
    const fixed = new Date();
    fixed.setHours(1, 2, 3, 0);
    vi.setSystemTime(fixed);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setArgv({ silent: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('writes to console.log by default with a prefixed timestamp', () => {
    const ts = `[${new Date().toTimeString().split(' ')[0]}] `; // matches implementation
    log('hello world');
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls[0][0]).toBe(ts + 'hello world');
  });

  it('writes to console.error when writeAsError=true without error object', () => {
    const ts = `[${new Date().toTimeString().split(' ')[0]}] `;
    log('bad', null, true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toBe(ts + 'bad');
  });

  it('writes to console.error with error object when provided', () => {
    const ts = `[${new Date().toTimeString().split(' ')[0]}] `;
    const err = new Error('boom');
    log('oops', err, true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toBe(ts + 'oops');
    expect(errorSpy.mock.calls[0][1]).toBe(err);
  });

  it('does nothing when argv.silent is true', () => {
    setArgv({ silent: true });
    log('shh');
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
