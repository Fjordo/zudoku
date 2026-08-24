import type { ReactNode } from 'react';
import { MAX_MISTAKES, type Difficulty } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import type { MessageKey } from '../../../i18n/en';
import { formatDuration } from '../../../lib/format';

interface GameStatsProps {
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  progress: number;
}

export function GameStats({ difficulty, elapsedMs, mistakes, progress }: GameStatsProps) {
  const { t } = useI18n();

  return (
    <div className="stats">
      <Stat label={t('game.statDifficulty')} value={t(`difficulty.${difficulty}` as MessageKey)} />
      <Stat label={t('game.statTime')} value={formatDuration(elapsedMs)} mono />
      <Stat
        label={t('game.statMistakes')}
        value={<Lives spent={mistakes} label={`${mistakes}/${MAX_MISTAKES}`} />}
      />
      <Stat label={t('game.statFilled')} value={`${progress}/81`} mono />
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

function Stat({ label, value, mono }: StatProps) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={mono ? 'stat__value tabular' : 'stat__value'}>{value}</span>
    </div>
  );
}

/** Remaining lives as lamps: three lit, one goes out per mistake. */
function Lives({ spent, label }: { spent: number; label: string }) {
  return (
    <span className="lives" role="img" aria-label={label} aria-live="polite">
      {Array.from({ length: MAX_MISTAKES }, (_, index) => (
        <span
          key={index}
          className={index < MAX_MISTAKES - spent ? 'lives__pip' : 'lives__pip lives__pip--spent'}
        />
      ))}
    </span>
  );
}
