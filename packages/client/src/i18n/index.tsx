import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en, type Dictionary, type MessageKey } from './en';
import { it } from './it';

export const LOCALES = ['en', 'it'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = { en: 'English', it: 'Italiano' };

const DICTIONARIES: Record<Locale, Dictionary> = { en, it };
const STORAGE_KEY = 'zudoku.locale';

export type TranslateValues = Record<string, string | number>;

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translates a key, replacing {placeholders} with the given values. */
  t: (key: MessageKey, values?: TranslateValues) => string;
  /** Translates a key whose value is a list of sentences. */
  tList: (key: MessageKey) => string[];
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice simply is not remembered */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const dictionary = DICTIONARIES[locale];
    return {
      locale,
      setLocale,
      t: (key, values) => {
        const entry = dictionary[key] ?? en[key];
        const template = Array.isArray(entry) ? entry.join(' ') : (entry as string);
        return interpolate(template, values);
      },
      tList: (key) => {
        const entry = dictionary[key] ?? en[key];
        return Array.isArray(entry) ? [...entry] : [entry as string];
      },
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside an I18nProvider');
  return context;
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** Stored choice first, then the browser languages, then English. */
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  for (const language of navigator.languages ?? [navigator.language]) {
    const candidate = language.slice(0, 2).toLowerCase();
    if (isLocale(candidate)) return candidate;
  }
  return 'en';
}

function interpolate(template: string, values?: TranslateValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
