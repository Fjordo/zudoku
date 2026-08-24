import { useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { MiniBoard } from '../features/techniques/MiniBoard';
import { TECHNIQUE_GUIDE, TECHNIQUE_LEVELS } from '../features/techniques/guide';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/en';
import './pages.css';
import '../features/techniques/techniques.css';

interface TechniquesPageProps {
  navigate: (path: string) => void;
}

/** Reference section: the rules, then each technique with how to apply it. */
export function TechniquesPage({ navigate }: TechniquesPageProps) {
  const { t, tList } = useI18n();
  const [open, setOpen] = useState<string | null>(TECHNIQUE_GUIDE[0]?.id ?? null);

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="button button--ghost" onClick={() => navigate('/')}>
          {t('common.back')}
        </button>
        <span className="topbar__title">{t('techniques.title')}</span>
        <LanguageSwitcher />
      </header>

      <section className="card stack">
        <h2 className="section-title">{t('techniques.rulesTitle')}</h2>
        <ul className="bullets">
          {tList('techniques.rules').map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <p className="small muted">{t('techniques.intro')}</p>

      {TECHNIQUE_LEVELS.map((level) => (
        <section key={level} className="stack">
          <h2 className="section-title">{t(`level.${level}` as MessageKey)}</h2>
          {TECHNIQUE_GUIDE.filter((entry) => entry.level === level).map((entry) => {
            const expanded = open === entry.id;
            return (
              <article key={entry.id} className="card technique">
                <button
                  type="button"
                  className="technique__header"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : entry.id)}
                >
                  <span className="technique__title">{t(`technique.${entry.id}` as MessageKey)}</span>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                <p className="small muted">{t(`guide.${entry.id}.summary` as MessageKey)}</p>
                {expanded && (
                  <div className="technique__body">
                    <ol className="bullets">
                      {tList(`guide.${entry.id}.steps` as MessageKey).map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <MiniBoard
                      example={entry.example}
                      caption={t(`guide.${entry.id}.caption` as MessageKey)}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
