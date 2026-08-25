import { memo } from 'react';
import { CELL_COUNT, DIGITS, EMPTY_CELL, SIZE, boxOf, colOf, rowOf } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import { hasNote, hintCells, type Flash, type GameState, type Highlight } from '../gameState';

interface BoardProps {
  state: GameState;
  highlight: Highlight;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export function Board({ state, highlight, disabled, onSelect }: BoardProps) {
  const { t } = useI18n();
  const explained = new Set(hintCells(state.hint));
  const flash = state.flash;

  return (
    <div className="board" role="grid" aria-label={t('game.boardLabel')}>
      {Array.from({ length: CELL_COUNT }, (_, index) => {
        // A rejected digit is never stored: the cell borrows it for the animation.
        const flashing = flash?.index === index ? flash : null;
        const value = flashing?.kind === 'rejected' ? flashing.digit : state.cells[index];
        return (
          <Cell
            key={index}
            index={index}
            value={value}
            notes={state.notes[index]}
            given={state.givens[index]}
            hinted={state.hinted[index]}
            selected={state.selected === index}
            matched={highlight.matches.has(index)}
            related={highlight.related.has(index)}
            placed={highlight.placed.has(index)}
            explained={explained.has(index)}
            flash={flashing?.kind ?? null}
            flashId={flashing?.id ?? 0}
            activeDigit={state.activeDigit}
            focusable={(state.selected ?? 0) === index}
            label={t('game.cellLabel', {
              row: rowOf(index) + 1,
              column: colOf(index) + 1,
              value: state.cells[index] || t('game.cellEmpty'),
            })}
            disabled={disabled}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

interface CellProps {
  index: number;
  value: number;
  notes: number;
  given: boolean;
  hinted: boolean;
  selected: boolean;
  matched: boolean;
  /** Sits on the row or column of the selected cell. */
  related: boolean;
  /** Holds a digit the selected cell can already see. */
  placed: boolean;
  explained: boolean;
  /** Animation the cell is playing: a digit seating for good, or one bouncing off. */
  flash: Flash['kind'] | null;
  /** Remounts the digit so a repeated flash replays instead of freezing. */
  flashId: number;
  /** Digit currently in play: its pencil marks light across the grid. */
  activeDigit: number | null;
  /** Roving tabindex: the grid is a single tab stop, arrows move inside it. */
  focusable: boolean;
  disabled: boolean;
  /** Localized accessible name. */
  label: string;
  onSelect: (index: number) => void;
}

const Cell = memo(function Cell({
  index,
  value,
  notes,
  given,
  hinted,
  selected,
  matched,
  related,
  placed,
  explained,
  flash,
  flashId,
  activeDigit,
  focusable,
  disabled,
  label,
  onSelect,
}: CellProps) {
  const className = [
    'cell',
    given && 'cell--given',
    hinted && 'cell--hinted',
    selected && 'cell--selected',
    matched && 'cell--matched',
    related && 'cell--related',
    placed && 'cell--placed',
    explained && 'cell--explained',
    flash === 'locked' && 'cell--locked',
    flash === 'rejected' && 'cell--rejected',
    colOf(index) % 3 === 2 && colOf(index) !== SIZE - 1 && 'cell--edge-right',
    rowOf(index) % 3 === 2 && rowOf(index) !== SIZE - 1 && 'cell--edge-bottom',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      role="gridcell"
      aria-label={label}
      aria-selected={selected}
      tabIndex={focusable ? 0 : -1}
      data-box={boxOf(index)}
      disabled={disabled}
      onClick={() => onSelect(index)}
    >
      {value !== EMPTY_CELL ? (
        <span key={flashId} className="cell__value">
          {value}
        </span>
      ) : notes !== 0 ? (
        <span className="cell__notes" aria-hidden="true">
          {DIGITS.map((digit) => (
            <span
              key={digit}
              className={digit === activeDigit ? 'cell__note cell__note--active' : 'cell__note'}
            >
              {hasNote(notes, digit) ? digit : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
});
