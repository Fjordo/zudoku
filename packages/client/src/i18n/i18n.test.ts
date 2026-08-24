import { describe, expect, it } from 'vitest';
import { en, type MessageKey } from './en';
import { it as italian } from './it';
import { LOCALES, isLocale } from './index';

const keys = Object.keys(en) as MessageKey[];

describe('dictionaries', () => {
  it('covers every English key in Italian', () => {
    expect(Object.keys(italian).sort()).toEqual(keys.slice().sort());
  });

  it('keeps list entries as lists in both languages', () => {
    for (const key of keys) {
      expect(Array.isArray(italian[key])).toBe(Array.isArray(en[key]));
    }
  });

  it('uses the same placeholders in both languages', () => {
    const placeholders = (value: string | readonly string[]): string[] =>
      [...(Array.isArray(value) ? value.join(' ') : (value as string)).matchAll(/\{(\w+)\}/g)]
        .map((match) => match[1])
        .sort();

    for (const key of keys) {
      expect(placeholders(italian[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('leaves no empty translation', () => {
    for (const key of keys) {
      const value = italian[key];
      const text = Array.isArray(value) ? value.join('') : (value as string);
      expect(text.trim().length, key).toBeGreaterThan(0);
    }
  });

  it('recognizes supported locales only', () => {
    expect(LOCALES).toEqual(['en', 'it']);
    expect(isLocale('it')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
});
