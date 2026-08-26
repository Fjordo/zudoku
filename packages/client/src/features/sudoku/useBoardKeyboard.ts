import { useEffect } from 'react';
import { CELL_COUNT, SIZE } from '@zudoku/shared';
import type { SudokuGameApi } from './useSudokuGame';

/**
 * Keyboard shortcuts for one board. They follow the same rule as the on-screen
 * controls: while input is blocked — paused, finished, or the guide open over
 * the board — a keystroke must not reach the grid.
 */
export function useBoardKeyboard(game: SudokuGameApi, enabled: boolean): void {
  const { input, erase, hint, toggleNotes, select } = game;
  const selected = game.state.selected;

  useEffect(() => {
    if (!enabled) return;
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
        select(moveSelection(selected, key));
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, erase, hint, input, select, selected, toggleNotes]);
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
