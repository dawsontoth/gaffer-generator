import { describe, expect, it } from 'vitest';
import { parameterizeString } from './parameterizeString.js';

describe('parameterizeString', () => {
  it('replaces simple parameters', () => {
    const result = parameterizeString('Hello, _name_!', { name: 'World' });
    expect(result).toBe('Hello, World!');
  });

  it('supports nested property access', () => {
    const result = parameterizeString('User: _user.name_ (<_user.id_>)', {
      user: { name: 'Alice', id: 42 }
    });
    expect(result).toBe('User: Alice (<42>)');
  });

  it('tries lowercase and uppercase fallbacks', () => {
    const ctx = { name: 'Alice', NAME: 'BOB' };
    // match: _Name_ -> tries Name, then name (exists)
    expect(parameterizeString('Hi _Name_', ctx)).toBe('Hi Alice');
    // match: _name_ -> tries name (exists)
    expect(parameterizeString('Hi _name_', ctx)).toBe('Hi Alice');
    // match: _NAME_ -> tries NAME (exists)
    expect(parameterizeString('Hi _NAME_', ctx)).toBe('Hi BOB');
  });

  it('leaves unknown parameters untouched', () => {
    const result = parameterizeString('Hello _unknown_ world', {});
    expect(result).toBe('Hello _unknown_ world');
  });
});
