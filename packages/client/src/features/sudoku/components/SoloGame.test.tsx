import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { generatePuzzle } from '@zudoku/shared';
import { I18nProvider } from '../../../i18n';
import { loadSoloGame } from '../soloStorage';
import { SoloGame } from './SoloGame';

const generated = generatePuzzle('easy', 7);

const renderGame = () =>
  render(
    <I18nProvider>
      <SoloGame
        difficulty="easy"
        puzzle={generated.puzzle}
        solution={generated.solution}
        restored={null}
        restoredElapsedMs={0}
        onExit={() => {}}
        onNewGame={() => {}}
      />
    </I18nProvider>,
  );

/** The elapsed time as the player reads it, next to its label. */
const shownTime = (): string =>
  screen.getByText('Time').parentElement!.querySelector('.stat__value')!.textContent!;

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  setVisibility('visible');
});

describe('SoloGame', () => {
  it('pauses itself when the tab goes away and gives back the time spent there', () => {
    renderGame();
    act(() => vi.advanceTimersByTime(5_000));
    expect(shownTime()).toBe('00:05');

    setVisibility('hidden');
    act(() => vi.advanceTimersByTime(3 * 60 * 60 * 1000));
    setVisibility('visible');

    // Three hours in a pocket are not three hours of play.
    expect(shownTime()).toBe('00:05');
    expect(screen.getByText('Paused')).toBeTruthy();
  });

  it('keeps counting once the player resumes', () => {
    renderGame();
    act(() => vi.advanceTimersByTime(5_000));

    setVisibility('hidden');
    act(() => vi.advanceTimersByTime(60_000));
    setVisibility('visible');

    // The aside carries a Resume too; this is the one on the pause overlay.
    const resume = screen.getByText('Paused').parentElement!.querySelector('button')!;
    act(() => resume.click());
    act(() => vi.advanceTimersByTime(4_000));

    expect(shownTime()).toBe('00:09');
  });

  it('writes the game out when the tab is hidden, not only at the next move', () => {
    renderGame();
    act(() => vi.advanceTimersByTime(12_000));

    setVisibility('hidden');

    const saved = loadSoloGame('easy');
    expect(saved?.state.puzzle).toBe(generated.puzzle);
    expect(saved?.elapsedMs).toBe(12_000);
  });
});
