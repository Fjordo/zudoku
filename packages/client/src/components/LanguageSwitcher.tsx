import { LOCALES, LOCALE_LABELS, useI18n } from '../i18n';

/** Compact language toggle, available from every screen header. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language" role="group" aria-label={t('common.language')}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className="language__option"
          aria-pressed={locale === option}
          aria-label={LOCALE_LABELS[option]}
          onClick={() => setLocale(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
