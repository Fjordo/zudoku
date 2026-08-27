import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const running = !paused && state.status === 'playing';
  const elapsedMs = useTimer(startedAt, running);

  // Mirrored in a ref so saving does not run on every timer tick and the
  // visibility listener can stay mounted for the whole game.
  const latest = useRef({ difficulty, state, elapsedMs, running });
  useEffect(() => {
    latest.current = { difficulty, state, elapsedMs, running };
  });

  const persist = useCallback(() => {
    const { difficulty: level, state: current, elapsedMs: elapsed } = latest.current;
    if (current.status !== 'playing') return;
    saveSoloGame({ version: 2, difficulty: level, state: current, elapsedMs: elapsed, savedAt: Date.now() });
  }, []);

  const pause = useCallback((next: boolean) => {
    if (!next) setStartedAt(Date.now() - latest.current.elapsedMs);
    setPaused(next);
  }, []);

  useEffect(() => {
    if (state.status === 'playing') persist();
    else clearSoloGame(difficulty);
  }, [difficulty, persist, state]);

  /**
   * The clock runs on the wall, and a phone can leave a tab in the background
   * for hours: the game pauses itself and hands back the time spent away, so a
   * puzzle left open overnight is not charged for the night. The save is
   * written here too, because nothing is guaranteed to run once the tab is
   * frozen — that is what a game reopened days later has to come back from.
   */
  useEffect(() => {
    let hiddenAt: number | null = null;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (latest.current.running) {
          hiddenAt = Date.now();
          pause(true);
        }
        persist();
        return;
      }
      if (hiddenAt === null) return;
      // The clock is still anchored before the pause, so pushing the anchor
      // forward by the time away is what keeps it off the player's watch.
      const away = Date.now() - hiddenAt;
      hiddenAt = null;
      setStartedAt((start) => start + away);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pause, persist]);

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
      mode="solo"
      game={game}
      difficulty={difficulty}
      elapsedMs={elapsedMs}
      title={t('game.solo')}
      onExit={onExit}
      locked={paused}
      overlay={overlay}
      aside={
        // Both actions stay in reach while the game runs: a new puzzle never
        // waits for this one to be lost.
        <div className="card stack game__actions">
          <button
            type="button"
            className="button button--block"
            onClick={() => pause(!paused)}
            disabled={state.status !== 'playing'}
          >
            {paused ? t('game.resume') : t('game.pause')}
          </button>
          <button type="button" className="button button--block" onClick={onNewGame}>
            {t('game.newGame')}
          </button>
          <p className="small muted game__keyboard-help">{t('game.keyboardHelp')}</p>
        </div>
      }
    />
  );
}
