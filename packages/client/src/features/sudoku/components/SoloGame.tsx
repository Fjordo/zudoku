import { useEffect, useMemo, useRef, useState } from 'react';
import { DIFFICULTY_PROFILES, type Difficulty } from '@zudoku/shared';
import { useTimer } from '../../../hooks/useTimer';
import { useI18n } from '../../../i18n';
import { formatDuration } from '../../../lib/format';
import type { GameState } from '../gameState';
import { clearSoloGame, saveSoloGame } from '../soloStorage';
import { useSudokuGame } from '../useSudokuGame';
import { GameScreen } from './GameScreen';

interface SoloGameProps {
  difficulty: Difficulty;
  puzzle: string;
  solution: string;
  restored: GameState | null;
  restoredElapsedMs: number;
  onExit: () => void;
  onNewGame: () => void;
  onLearnMore: () => void;
}

/** One solo run: timer, persistence and the end-of-game panel. */
export function SoloGame({
  difficulty,
  puzzle,
  solution,
  restored,
  restoredElapsedMs,
  onExit,
  onNewGame,
  onLearnMore,
}: SoloGameProps) {
  const { t } = useI18n();
  const setup = useMemo(
    () => ({ puzzle, solution, hints: DIFFICULTY_PROFILES[difficulty].hints }),
    [difficulty, puzzle, solution],
  );
  const game = useSudokuGame(setup, restored);
  const { state } = game;

  const [paused, setPaused] = useState(false);
  // Anchoring the start in the past restores the elapsed time of a saved game.
  const [startedAt, setStartedAt] = useState(() => Date.now() - restoredElapsedMs);
  const elapsedMs = useTimer(startedAt, !paused && state.status === 'playing');

  // Mirrored in a ref so saving does not run on every timer tick.
  const elapsedRef = useRef(elapsedMs);
  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);

  const pause = (next: boolean) => {
    if (!next) setStartedAt(Date.now() - elapsedRef.current);
    setPaused(next);
  };

  useEffect(() => {
    if (state.status === 'playing') {
      saveSoloGame({ version: 1, difficulty, state, elapsedMs: elapsedRef.current, savedAt: Date.now() });
    } else {
      clearSoloGame();
    }
  }, [difficulty, state]);

  const overlay =
    state.status === 'playing' ? (
      paused ? (
        <div className="overlay">
          <span className="overlay__title">{t('game.paused')}</span>
          <button type="button" className="button button--primary" onClick={() => pause(false)}>
            {t('game.resume')}
          </button>
        </div>
      ) : null
    ) : (
      <div className="overlay">
        <span className="overlay__title">{state.status === 'won' ? t('game.solved') : t('game.lost')}</span>
        <p className="muted">
          {state.status === 'won'
            ? t('game.solvedDetail', { time: formatDuration(elapsedMs), mistakes: state.mistakes })
            : t('game.lostDetail')}
        </p>
        <div className="row">
          <button type="button" className="button button--primary" onClick={onNewGame}>
            {t('game.newGame')}
          </button>
          <button type="button" className="button" onClick={onExit}>
            {t('common.home')}
          </button>
        </div>
      </div>
    );

  return (
    <GameScreen
      game={game}
      difficulty={difficulty}
      elapsedMs={elapsedMs}
      title={t('game.solo')}
      onExit={onExit}
      onLearnMore={onLearnMore}
      locked={paused}
      overlay={overlay}
      aside={
        <div className="card stack">
          <button
            type="button"
            className="button button--block"
            onClick={() => pause(!paused)}
            disabled={state.status !== 'playing'}
          >
            {paused ? t('game.resume') : t('game.pause')}
          </button>
          <button type="button" className="button button--block" onClick={onNewGame}>
            {t('game.newPuzzle')}
          </button>
          <p className="small muted">{t('game.keyboardHelp')}</p>
        </div>
      }
    />
  );
}
