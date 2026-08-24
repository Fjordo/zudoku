import { memo } from 'react';
import { CELL_COUNT, DIGITS, EMPTY_CELL, SIZE, boxOf, colOf, rowOf } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import { hasNote, hintCells, isWrong, type GameState, type Highlight } from '../gameState';

interface BoardProps {
  state: GameState;
  highlight: Highlight;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export function Board({ state, highlight, disabled, onSelect }: BoardProps) {
  const { t } = useI18n();
  const explained = new Set(hintCells(state.hint));

  return (
    <div className="board" role="grid" aria-label={t('game.boardLabel')}>
      {Array.from({ length: CELL_COUNT }, (_, index) => (
        <Cell
          key={index}
          index={index}
          value={state.cells[index]}
          notes={state.notes[index]}
          given={state.givens[index]}
          hinted={state.hinted[index]}
          wrong={isWrong(state, index)}
          selected={state.selected === index}
          matched={highlight.matches.has(index)}
          online={highlight.lines.has(index)}
          related={highlight.related.has(index)}
          explained={explained.has(index)}
          focusable={(state.selected ?? 0) === index}
          label={t('game.cellLabel', {
            row: rowOf(index) + 1,
            column: colOf(index) + 1,
            value: state.cells[index] || t('game.cellEmpty'),
          })}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface CellProps {
  index: number;
  value: number;
  notes: number;
  given: boolean;
  hinted: boolean;
  wrong: boolean;
  selected: boolean;
  matched: boolean;
  /** Sits on a row, column or box that contains the highlighted digit. */
  online: boolean;
  related: boolean;
  explained: boolean;
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
  wrong,
  selected,
  matched,
  online,
  related,
  explained,
  focusable,
  disabled,
  label,
  onSelect,
}: CellProps) {
  const className = [
    'cell',
    given && 'cell--given',
    hinted && 'cell--hinted',
    wrong && 'cell--wrong',
    selected && 'cell--selected',
    matched && 'cell--matched',
    online && 'cell--online',
    related && 'cell--related',
    explained && 'cell--explained',
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
        <span className="cell__value">{value}</span>
      ) : notes !== 0 ? (
        <span className="cell__notes" aria-hidden="true">
          {DIGITS.map((digit) => (
            <span key={digit} className="cell__note">
              {hasNote(notes, digit) ? digit : ''}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
});
