import { useState } from 'react';
import { DIFFICULTIES, DIFFICULTY_PROFILES, MAX_MISTAKES, type Difficulty } from '@zudoku/shared';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { loadSoloGame } from '../features/sudoku/soloStorage';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/en';
import './pages.css';

interface HomePageProps {
  navigate: (path: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const { t } = useI18n();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const saved = loadSoloGame(difficulty);

  return (
    <div className="page home">
      <header className="topbar topbar--end">
        <LanguageSwitcher />
      </header>

      <div className="home__hero">
        <h1 className="home__title">Zudoku</h1>
        <p className="muted">{t('home.tagline')}</p>
      </div>

      <section className="card card--solo stack">
        <h2 className="section-title">{t('home.solo')}</h2>
        <div className="field">
          <span className="field__label">{t('home.difficulty')}</span>
          <div className="segmented">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                className="segmented__option"
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
              >
                {t(`difficulty.${level}` as MessageKey)}
              </button>
            ))}
          </div>
        </div>
        <p className="small muted">
          {t('home.soloMeta', {
            hints: DIFFICULTY_PROFILES[difficulty].hints,
            mistakes: MAX_MISTAKES,
          })}
        </p>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={() => navigate(`/solo/${difficulty}`)}
        >
          {saved ? t('home.resume') : t('home.play')}
        </button>
      </section>

      <section className="card card--challenge stack">
        <h2 className="section-title">{t('home.challenge')}</h2>
        <p className="small muted">{t('home.challengeDesc')}</p>
        <button type="button" className="button button--outline button--block" onClick={() => navigate('/challenge')}>
          {t('home.challengeCta')}
        </button>
      </section>

      <button type="button" className="button button--ghost button--block" onClick={() => navigate('/techniques')}>
        {t('home.techniques')}
      </button>
    </div>
  );
}
