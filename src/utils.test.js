const spyLog = jest.spyOn(console, 'log');
const spyError = jest.spyOn(console, 'error');

jest.mock('fs');
const utils = require('./utils');
const fs = require('fs');

describe('contentsDiffer', () => {
  test('handles one or more empty contents', () => {
    expect(utils.contentsDiffer('', '')).toBe(false);
    expect(utils.contentsDiffer('a', '')).toBe(true);
    expect(utils.contentsDiffer('', 'b')).toBe(true);
  });
  test('handles normal cases', () => {
    expect(utils.contentsDiffer('a', 'a')).toBe(false);
    expect(utils.contentsDiffer('a', 'b')).toBe(true);
    expect(utils.contentsDiffer('a', 'A')).toBe(true);
  });
  test('handles line endings', () => {
    expect(utils.contentsDiffer('a\na', 'a\na')).toBe(false);
    expect(utils.contentsDiffer('a\r\na', 'a\na')).toBe(false);
    expect(utils.contentsDiffer('a\r\na', 'a\r\na')).toBe(false);
    expect(utils.contentsDiffer('a\na', 'a\r\na')).toBe(false);
  });
});

describe('safeRead', () => {
  test('returns null when file does not exist', () => {
    fs.__setResponse('existsSync', false);
    expect(utils.safeRead('/foo/bar.js')).toBe(null);
  });
  test('returns contents when file does exist', () => {
    fs.__setResponse('existsSync', true);
    fs.__setResponse('readFileSync', 'baz');
    expect(utils.safeRead('/foo/bar.js')).toBe('baz');
  });
  test('allows string argument', () => {
    fs.__setResponse('existsSync', false);
    expect(utils.safeRead('/foo/bar.js')).toBe(null);
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo/bar.js');
  });
  test('allows file argument', () => {
    fs.__setResponse('existsSync', false);
    expect(utils.safeRead({ dirname: '/foo', basename: 'bar.js' })).toBe(null);
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo/bar.js');
  });
});

describe('safeWrite', () => {
  test('creates directories recursively', () => {
    fs.__setResponse('existsSync', false);
    utils.safeWrite('/foo/bar/baz.js', 'qux');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.mkdirSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo/bar');
    expect(fs.__spy.mkdirSync).toHaveBeenCalledWith('/foo/bar');
    expect(fs.__spy.writeFileSync).toHaveBeenCalledWith('/foo/bar/baz.js', 'qux', 'UTF-8');
  });
  test('only creates directories when they do not exist', () => {
    fs.__setResponse('existsSync', true);
    utils.safeWrite('/foo/bar/baz.js', 'qux');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.mkdirSync).not.toHaveBeenCalledWith('/foo');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo/bar');
    expect(fs.__spy.mkdirSync).not.toHaveBeenCalledWith('/foo/bar');
    expect(fs.__spy.writeFileSync).toHaveBeenCalledWith('/foo/bar/baz.js', 'qux', 'UTF-8');
  });
  test('allows string argument', () => {
    fs.__setResponse('existsSync', false);
    utils.safeWrite('/foo/bar.js', 'baz');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.mkdirSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.writeFileSync).toHaveBeenCalledWith('/foo/bar.js', 'baz', 'UTF-8');
  });
  test('allows file argument', () => {
    fs.__setResponse('existsSync', false);
    utils.safeWrite({ dirname: '/foo', basename: 'bar.js' }, 'baz');
    expect(fs.__spy.existsSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.mkdirSync).toHaveBeenCalledWith('/foo');
    expect(fs.__spy.writeFileSync).toHaveBeenCalledWith('/foo/bar.js', 'baz', 'UTF-8');
  });
});

describe('logChange', () => {
  test('calls console.log', () => {
    expect(spyError).not.toHaveBeenCalled();
    expect(spyLog).not.toHaveBeenCalled();
    utils.logChange('foo');
    expect(spyError).not.toHaveBeenCalled();
    expect(spyLog).toHaveBeenCalled();
  });
});

describe('logRemoval', () => {
  test('calls console.log', () => {
    expect(spyError).not.toHaveBeenCalled();
    expect(spyLog).not.toHaveBeenCalled();
    utils.logRemoval('foo');
    expect(spyError).not.toHaveBeenCalled();
    expect(spyLog).toHaveBeenCalled();
  });
});

describe('logError', () => {
  test('calls console.error', () => {
    expect(spyError).not.toHaveBeenCalled();
    expect(spyLog).not.toHaveBeenCalled();
    utils.logError('foo');
    expect(spyError).toHaveBeenCalled();
    expect(spyLog).not.toHaveBeenCalled();
  });
});

describe('parameterizeString', () => {
  test('translates', () => {
    expect(utils.parameterizeString('foo', {})).toBe('foo');
    expect(utils.parameterizeString('_foo_', {})).toBe('_foo_');
    expect(utils.parameterizeString('_foo_', { foo: 'bar' })).toBe('bar');
    expect(utils.parameterizeString('_foo.bar_', { foo: { bar: 'baz' } })).toBe('baz');
    expect(utils.parameterizeString('_foo_', { foo: 2 })).toBe('2');
  });
});

describe('lowerCaseFirst', () => {
  test('lowers first letter', () => {
    expect(utils.lowerCaseFirst('Foo')).toBe('foo');
    expect(utils.lowerCaseFirst('FOO')).toBe('fOO');
  });
  test('leaves strings with lower-first alone', () => {
    expect(utils.lowerCaseFirst('')).toBe('');
    expect(utils.lowerCaseFirst('foo')).toBe('foo');
    expect(utils.lowerCaseFirst('fOO')).toBe('fOO');
    expect(utils.lowerCaseFirst('foO')).toBe('foO');
  });
  test('ignores numbers at the start', () => {
    expect(utils.lowerCaseFirst('0oO')).toBe('0oO');
  });
  test('passes through non-strings', () => {
    expect(utils.lowerCaseFirst(false)).toBe(false);
    expect(utils.lowerCaseFirst(undefined)).toBe(undefined);
    expect(utils.lowerCaseFirst(null)).toBe(null);
    expect(utils.lowerCaseFirst(1)).toBe(1);
  });
});
