import { useCallback, useEffect, useState } from 'react';
import type { Difficulty } from '@zudoku/shared';
import { SoloGame } from '../features/sudoku/components/SoloGame';
import type { GameState } from '../features/sudoku/gameState';
import { createPuzzle } from '../features/sudoku/puzzleService';
import { clearSoloGame, loadSoloGame } from '../features/sudoku/soloStorage';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/en';

interface SoloPageProps {
  difficulty: Difficulty;
  navigate: (path: string) => void;
}

interface Session {
  puzzle: string;
  solution: string;
  restored: GameState | null;
  restoredElapsedMs: number;
}

export function SoloPage({ difficulty, navigate }: SoloPageProps) {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setError(null);

    const saved = reloadToken === 0 ? loadSoloGame(difficulty) : null;
    if (saved) {
      setSession({
        puzzle: saved.state.puzzle,
        solution: saved.state.solution,
        restored: saved.state,
        restoredElapsedMs: saved.elapsedMs,
      });
      return;
    }

    createPuzzle(difficulty)
      .then((generated) => {
        if (cancelled) return;
        setSession({
          puzzle: generated.puzzle,
          solution: generated.solution,
          restored: null,
          restoredElapsedMs: 0,
        });
      })
      .catch(() => !cancelled && setError('game.generateError'));

    return () => {
      cancelled = true;
    };
  }, [difficulty, reloadToken]);

  const startNewGame = useCallback(() => {
    clearSoloGame();
    setReloadToken((token) => token + 1);
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="card stack">
          <p>{t(error as MessageKey)}</p>
          <button type="button" className="button button--primary" onClick={startNewGame}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page">
        <div className="card stack" aria-busy="true">
          <h2>
            {t('game.loading', { difficulty: t(`difficulty.${difficulty}` as MessageKey).toLowerCase() })}
          </h2>
          <p className="muted small">{t('game.loadingDetail')}</p>
        </div>
      </div>
    );
  }

  return (
    <SoloGame
      key={session.puzzle}
      difficulty={difficulty}
      puzzle={session.puzzle}
      solution={session.solution}
      restored={session.restored}
      restoredElapsedMs={session.restoredElapsedMs}
      onExit={() => navigate('/')}
      onNewGame={startNewGame}
    />
  );
}
