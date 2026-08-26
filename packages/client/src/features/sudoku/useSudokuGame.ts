import { useCallback, useEffect, useMemo, useReducer } from 'react';
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

/** Owns the reducer and the actions for one board; see useBoardKeyboard for the shortcuts. */
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
