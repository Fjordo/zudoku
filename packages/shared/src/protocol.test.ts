import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, isValidRoomCode, sanitizePlayerName } from './protocol.js';

describe('sanitizePlayerName', () => {
  it('collapses whitespace and caps the length', () => {
    expect(sanitizePlayerName('  Ada   Lovelace  ')).toBe('Ada Lovelace');
    expect(sanitizePlayerName('x'.repeat(MAX_NAME_LENGTH + 10))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('drops control characters', () => {
    expect(sanitizePlayerName('Ada\u0000\u0007Lovelace')).toBe('AdaLovelace');
  });

  it('drops the bidi overrides a name could be spoofed with', () => {
    expect(sanitizePlayerName('Ada\u202etsoh')).toBe('Adatsoh');
    expect(sanitizePlayerName('\u2066Ada\u2069')).toBe('Ada');
  });

  it('drops zero-width characters, so two names cannot look identical', () => {
    expect(sanitizePlayerName('Ada\u200b')).toBe('Ada');
    expect(sanitizePlayerName('A\u200cda')).toBe(sanitizePlayerName('Ada'));
  });

  it('rejects a name that is nothing but invisible characters', () => {
    expect(sanitizePlayerName('\u200b\u202e\u0000')).toBe('');
  });
});

describe('isValidRoomCode', () => {
  it('accepts a normalized code and rejects anything else', () => {
    expect(isValidRoomCode('abc234')).toBe(true);
    expect(isValidRoomCode(' ABC234 ')).toBe(true);
    expect(isValidRoomCode('ABC23')).toBe(false);
    expect(isValidRoomCode('ABC01I')).toBe(false);
  });
});
