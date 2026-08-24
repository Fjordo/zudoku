import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { colOf, generatePuzzle, rowOf } from '@zudoku/shared';
import { I18nProvider } from '../../../i18n';
import { useSudokuGame } from '../useSudokuGame';
import { Board } from './Board';
import { NumberPad } from './NumberPad';

const generated = generatePuzzle('easy', 99);

function Harness() {
  const game = useSudokuGame({ puzzle: generated.puzzle, solution: generated.solution, hints: 3 });
  return (
    <I18nProvider>
      <Board state={game.state} highlight={game.highlight} disabled={false} onSelect={game.select} />
      <NumberPad state={game.state} disabled={false} onInput={game.input} />
    </I18nProvider>
  );
}

const cells = (): HTMLElement[] => screen.getAllByRole('gridcell');

describe('Board and NumberPad', () => {
  it('highlights the rows and columns holding the digit that was tapped', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const digit = 4;
    await user.click(screen.getByRole('button', { name: `Digit ${digit}` }));

    const board = cells();
    const matched = board.filter((cell) => cell.className.includes('cell--matched'));
    expect(matched.length).toBeGreaterThan(0);

    for (const cell of matched) {
      expect(cell.textContent).toBe(String(digit));
      const index = board.indexOf(cell);
      // Every cell sharing that row or column is lit as well.
      const sameRow = board.filter((_, other) => rowOf(other) === rowOf(index));
      const sameColumn = board.filter((_, other) => colOf(other) === colOf(index));
      for (const lit of [...sameRow, ...sameColumn]) {
        expect(lit.className).toContain('cell--online');
      }
    }
  });

  it('writes the tapped digit into the selected cell', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const board = cells();
    const emptyIndex = board.findIndex((cell) => cell.textContent === '');
    const target = board[emptyIndex];
    await user.click(target);
    expect(target.className).toContain('cell--selected');

    const digit = Number(generated.solution[emptyIndex]);
    await user.click(screen.getByRole('button', { name: `Digit ${digit}` }));

    expect(target.textContent).toBe(String(digit));
    expect(target.className).not.toContain('cell--wrong');
  });

  it('marks a wrong digit', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const board = cells();
    const emptyIndex = board.findIndex((cell) => cell.textContent === '');
    const wrong = (Number(generated.solution[emptyIndex]) % 9) + 1;

    await user.click(board[emptyIndex]);
    await user.click(screen.getByRole('button', { name: `Digit ${wrong}` }));

    expect(board[emptyIndex].className).toContain('cell--wrong');
  });
});
