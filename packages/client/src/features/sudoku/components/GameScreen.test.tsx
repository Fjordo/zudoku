import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generatePuzzle } from '@zudoku/shared';
import { I18nProvider } from '../../../i18n';
import { useSudokuGame } from '../useSudokuGame';
import { GameScreen } from './GameScreen';

const generated = generatePuzzle('easy', 7);

function Harness() {
  const game = useSudokuGame({ puzzle: generated.puzzle, solution: generated.solution, hints: 3 });
  const [locked, setLocked] = useState(false);
  return (
    <I18nProvider>
      <button type="button" onClick={() => setLocked(true)}>
        Lock
      </button>
      <GameScreen
        mode="solo"
        game={game}
        difficulty="easy"
        elapsedMs={0}
        title="Solo"
        onExit={() => {}}
        locked={locked}
      />
    </I18nProvider>
  );
}

const cells = (): HTMLElement[] => screen.getAllByRole('gridcell');
const emptyCell = (): HTMLElement => cells().find((cell) => cell.textContent === '')!;

const askHint = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /Hint/ }));

const openGuide = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Learn' }));

describe('GameScreen', () => {
  it('opens the guide over the board instead of leaving the game', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await askHint(user);
    await openGuide(user);

    // The board is still mounted, so a challenge connection survives the read.
    expect(screen.getByRole('dialog', { name: 'Rules and advanced techniques' })).toBeTruthy();
    expect(cells()).toHaveLength(81);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps keystrokes out of the board while the guide is open', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // The hint fills a cell of its own, so the target is picked after it.
    await askHint(user);
    const target = emptyCell();
    const digit = generated.solution[cells().indexOf(target)];
    await user.click(target);
    await openGuide(user);

    await user.keyboard(digit);
    expect(target.textContent).toBe('');
  });

  it('ignores keystrokes while the board is locked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const target = emptyCell();
    const digit = generated.solution[cells().indexOf(target)];
    await user.click(target);
    await user.click(screen.getByRole('button', { name: 'Lock' }));

    await user.keyboard(digit);
    expect(target.textContent).toBe('');
  });
});
