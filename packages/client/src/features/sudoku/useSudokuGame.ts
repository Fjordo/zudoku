import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { CELL_COUNT, SIZE } from '@zudoku/shared';
import {
  FLASH_MS,
  computeHighlight,
  createGame,
  filledCount,
  gameReducer,
  type GameAction,
  type GameSetup,
  type GameState,
} from './gameState';

export interface SudokuGameApi {
  state: GameState;
  highlight: ReturnType<typeof computeHighlight>;
  filled: number;
  dispatch: (action: GameAction) => void;
  select: (index: number | null) => void;
  input: (digit: number) => void;
  erase: () => void;
  undo: () => void;
  hint: () => void;
  toggleNotes: () => void;
  highlightDigit: (digit: number | null) => void;
}

/** Owns the reducer, keyboard shortcuts and arrow-key navigation for one board. */
export function useSudokuGame(setup: GameSetup, restored?: GameState | null): SudokuGameApi {
  const [state, dispatch] = useReducer(
    gameReducer,
    { setup, restored },
    ({ setup: initial, restored: saved }) => saved ?? createGame(initial),
  );

  const select = useCallback((index: number | null) => dispatch({ type: 'select', index }), []);
  const input = useCallback((digit: number) => dispatch({ type: 'input', digit }), []);
  const erase = useCallback(() => dispatch({ type: 'erase' }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const hint = useCallback(() => dispatch({ type: 'hint' }), []);
  const toggleNotes = useCallback(() => dispatch({ type: 'toggle_notes' }), []);
  const highlightDigit = useCallback((digit: number | null) => dispatch({ type: 'highlight', digit }), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      if (/^[1-9]$/.test(key)) {
        input(Number(key));
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        erase();
      } else if (key === 'n' || key === 'N') {
        toggleNotes();
      } else if (key === 'h' || key === 'H') {
        hint();
      } else if (key.startsWith('Arrow')) {
        dispatch({ type: 'select', index: moveSelection(state.selected, key) });
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [erase, hint, input, state.selected, toggleNotes]);

  // The board animates the last entry, then the flash is dropped so the cell
  // goes back to its resting state — empty for a rejected digit.
  const flash = state.flash;
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'clear_flash', id: flash.id }),
      FLASH_MS[flash.kind],
    );
    return () => window.clearTimeout(timer);
  }, [flash]);

  const highlight = useMemo(() => computeHighlight(state), [state]);
  const filled = useMemo(() => filledCount(state), [state]);

  return { state, highlight, filled, dispatch, select, input, erase, undo, hint, toggleNotes, highlightDigit };
}

const OFFSETS: Record<string, number> = {
  ArrowUp: -SIZE,
  ArrowDown: SIZE,
  ArrowLeft: -1,
  ArrowRight: 1,
};

function moveSelection(current: number | null, key: string): number {
  const offset = OFFSETS[key] ?? 0;
  if (current === null) return 0;
  const next = current + offset;
  if (next < 0 || next >= CELL_COUNT) return current;
  // Horizontal moves must not jump to the next row.
  if (Math.abs(offset) === 1 && Math.floor(next / SIZE) !== Math.floor(current / SIZE)) return current;
  return next;
}
