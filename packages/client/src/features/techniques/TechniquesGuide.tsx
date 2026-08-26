import { useState } from 'react';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n/en';
import { MiniBoard } from './MiniBoard';
import { UnitsDiagram } from './UnitsDiagram';
import { TECHNIQUE_GUIDE, TECHNIQUE_LEVELS } from './guide';
import './techniques.css';

/** The reference itself: the rules, then each technique with how to apply it. */
export function TechniquesGuide() {
  const { t, tList } = useI18n();
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(TECHNIQUE_GUIDE[0] ? [TECHNIQUE_GUIDE[0].id] : []),
  );

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const ruleTitles = tList('techniques.ruleTitles');
  const rules = tList('techniques.rules');

  return (
    <div className="guide">
      <div className="guide__masthead">
        <h1 className="guide__title">{t('techniques.title')}</h1>
        <p className="small muted">{t('techniques.lede')}</p>
      </div>

      <section className="card rules">
        <div className="stack">
          <h2 className="section-title">{t('techniques.rulesTitle')}</h2>
          <p>{t('techniques.rulesLead')}</p>
        </div>

        <UnitsDiagram />
        <p className="small muted">{t('techniques.unitsNote')}</p>

        <ul className="rules__list">
          {rules.map((rule, index) => (
            <li key={rule} className="rules__item">
              <strong>{ruleTitles[index]}</strong>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2 className="section-title">{t('techniques.howToRead')}</h2>
        <p>{t('techniques.intro')}</p>
        <p className="small muted">{t('techniques.notesNote')}</p>
      </section>

      {TECHNIQUE_LEVELS.map((level) => (
        <section key={level} className={`techniques__band techniques__band--${level}`}>
          <div className="techniques__heading">
            <h2 className="section-title">{t(`level.${level}` as MessageKey)}</h2>
          </div>
          <p className="small muted techniques__blurb">{t(`level.${level}.blurb` as MessageKey)}</p>

          {TECHNIQUE_GUIDE.filter((entry) => entry.level === level).map((entry) => {
            const expanded = open.has(entry.id);
            return (
              <article key={entry.id} className="card technique">
                <button
                  type="button"
                  className="technique__header"
                  aria-expanded={expanded}
                  onClick={() => toggle(entry.id)}
                >
                  <span className="technique__title">{t(`technique.${entry.id}` as MessageKey)}</span>
                  <span className="technique__toggle" aria-hidden="true">
                    {expanded ? '−' : '+'}
                  </span>
                </button>
                <p className="technique__summary muted">
                  {t(`guide.${entry.id}.summary` as MessageKey)}
                </p>

                {expanded && (
                  <div className="technique__body">
                    <div className="technique__block">
                      <span className="technique__label">{t('techniques.stepsLabel')}</span>
                      <ol className="technique__steps">
                        {tList(`guide.${entry.id}.steps` as MessageKey).map((step) => (
                          <li key={step} className="technique__step">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="technique__block">
                      <span className="technique__label">{t('techniques.exampleLabel')}</span>
                      <MiniBoard
                        example={entry.example}
                        caption={t(`guide.${entry.id}.caption` as MessageKey)}
                      />
                    </div>

                    <p className="technique__gain">{t(`guide.${entry.id}.gain` as MessageKey)}</p>
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
