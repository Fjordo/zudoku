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
        value={`${mistakes}/${MAX_MISTAKES}`}
        tone={mistakes > 0 ? 'warn' : undefined}
        live
      />
      <Stat label={t('game.statFilled')} value={`${progress}/81`} mono />
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'warn';
  /** Announces changes to screen readers, used for the mistake counter. */
  live?: boolean;
}

function Stat({ label, value, mono, tone, live }: StatProps) {
  return (
    <div className={tone === 'warn' ? 'stat stat--warn' : 'stat'}>
      <span className="stat__label">{label}</span>
      <span className={mono ? 'stat__value tabular' : 'stat__value'} aria-live={live ? 'polite' : undefined}>
        {value}
      </span>
    </div>
  );
}
