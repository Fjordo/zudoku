import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { generatePuzzle } from '@zudoku/shared';
import { createGame } from '../features/sudoku/gameState';
import { saveSoloGame } from '../features/sudoku/soloStorage';
import { I18nProvider } from '../i18n';
import { HomePage } from './HomePage';

const saveMedium = () => {
  const { puzzle, solution } = generatePuzzle('medium', 3);
  saveSoloGame({
    version: 2,
    difficulty: 'medium',
    state: createGame({ puzzle, solution, hints: 3 }),
    elapsedMs: 30_000,
    savedAt: Date.now(),
  });
};

const renderHome = () =>
  render(
    <I18nProvider>
      <HomePage navigate={() => {}} />
    </I18nProvider>,
  );

const option = (label: string): HTMLElement => screen.getByRole('button', { name: label });

beforeEach(() => localStorage.clear());

describe('HomePage', () => {
  it('opens on the difficulty left in progress, so the saved game is one tap away', () => {
    saveMedium();
    renderHome();

    expect(option('Medium').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeTruthy();
  });

  it('starts on easy and offers a fresh game when nothing was left behind', () => {
    renderHome();

    expect(option('Easy').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });
});
