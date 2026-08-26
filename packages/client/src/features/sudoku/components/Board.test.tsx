import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  it('lights only the cells holding the digit that was tapped', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const digit = 4;
    await user.click(screen.getByRole('button', { name: `Digit ${digit}` }));

    const board = cells();
    const matched = board.filter((cell) => cell.className.includes('cell--matched'));
    expect(matched.length).toBeGreaterThan(0);

    for (const cell of board) {
      expect(cell.className.includes('cell--matched')).toBe(cell.textContent === String(digit));
    }
  });

  it('marks the digits the selected cell already sees', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const board = cells();
    const emptyIndex = board.findIndex((cell) => cell.textContent === '');
    await user.click(board[emptyIndex]);

    for (const [index, cell] of board.entries()) {
      const sees = index !== emptyIndex && (rowOf(index) === rowOf(emptyIndex) || colOf(index) === colOf(emptyIndex));
      expect(cell.className.includes('cell--placed')).toBe(sees && cell.textContent !== '');
    }
  });

  it('writes the tapped digit into the selected cell and keeps it there', async () => {
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
    expect(target.className).toContain('cell--locked');
  });

  it('shakes a wrong digit off instead of keeping it', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const board = cells();
    const emptyIndex = board.findIndex((cell) => cell.textContent === '');
    const target = board[emptyIndex];
    const wrong = (Number(generated.solution[emptyIndex]) % 9) + 1;

    await user.click(target);
    await user.click(screen.getByRole('button', { name: `Digit ${wrong}` }));

    expect(target.className).toContain('cell--rejected');
    expect(target.textContent).toBe(String(wrong));

    await waitFor(() => expect(target.textContent).toBe(''));
    expect(target.className).not.toContain('cell--rejected');
  });
});
