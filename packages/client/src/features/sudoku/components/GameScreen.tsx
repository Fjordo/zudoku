import { useState, type ReactNode } from 'react';
import type { Difficulty } from '@zudoku/shared';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { TechniquesDialog } from '../../techniques/TechniquesDialog';
import { useI18n } from '../../../i18n';
import { useBoardKeyboard } from '../useBoardKeyboard';
import type { SudokuGameApi } from '../useSudokuGame';
import { Board } from './Board';
import { GameControls } from './GameControls';
import { GameStats } from './GameStats';
import { HintBanner } from './HintBanner';
import { NumberPad } from './NumberPad';
import '../sudoku.css';

interface GameScreenProps {
  game: SudokuGameApi;
  /** Which mode this board belongs to; it colours the screen's chrome. */
  mode: 'solo' | 'challenge';
  difficulty: Difficulty;
  elapsedMs: number;
  title: string;
  onExit: () => void;
  /** Extra panel shown beside the board, e.g. the challenge scoreboard. */
  aside?: ReactNode;
  /** Result panel shown once the game is over. */
  overlay?: ReactNode;
  /** Blocks input while the game is not running. */
  locked?: boolean;
}

export function GameScreen({
  game,
  mode,
  difficulty,
  elapsedMs,
  title,
  onExit,
  aside,
  overlay,
  locked = false,
}: GameScreenProps) {
  const { t } = useI18n();
  const [guideOpen, setGuideOpen] = useState(false);
  const { state, highlight, filled } = game;
  const disabled = locked || state.status !== 'playing';

  useBoardKeyboard(game, !disabled && !guideOpen);

  const pageClass = [
    'page page--wide game',
    `game--${mode}`,
    state.hint && 'game--hinted',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={pageClass}>
      <header className="topbar">
        <button type="button" className="button button--ghost" onClick={onExit}>
          {t('common.back')}
        </button>
        <span className="topbar__title">{title}</span>
        <LanguageSwitcher />
      </header>

      <GameStats difficulty={difficulty} elapsedMs={elapsedMs} mistakes={state.mistakes} progress={filled} />

      <div className="game__layout">
        <div className="game__main">
          <div className="game__board">
            <div className="board__frame">
              <Board state={state} highlight={highlight} disabled={disabled} onSelect={game.select} />
              {overlay}
            </div>
          </div>
          {/* The hint sits with the keypad so showing it never reflows the board. */}
          <div className="game__input">
            {state.hint && (
              <HintBanner
                hint={state.hint}
                onDismiss={() => game.dispatch({ type: 'dismiss_hint' })}
                onLearnMore={() => setGuideOpen(true)}
              />
            )}
            <NumberPad state={state} disabled={disabled} onInput={game.input} />
            <GameControls
              notesMode={state.notesMode}
              hintsLeft={state.hintsLeft}
              canUndo={state.history.length > 0}
              disabled={disabled}
              onUndo={game.undo}
              onErase={game.erase}
              onToggleNotes={game.toggleNotes}
              onHint={game.hint}
            />
          </div>
        </div>
        {aside && <aside className="game__aside">{aside}</aside>}
      </div>

      {/* Read the rules without leaving the game: a challenge cannot be rejoined. */}
      {guideOpen && <TechniquesDialog onClose={() => setGuideOpen(false)} />}
    </div>
  );
}
