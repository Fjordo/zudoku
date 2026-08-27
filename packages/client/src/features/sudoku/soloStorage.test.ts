import { beforeEach, describe, expect, it } from 'vitest';
import { generatePuzzle, type Difficulty } from '@zudoku/shared';
import { createGame, type GameState } from './gameState';
import {
  clearSoloGame,
  latestSavedDifficulty,
  loadSoloGame,
  saveSoloGame,
  type SavedSoloGame,
} from './soloStorage';

const LEGACY_KEY = 'zudoku.solo.v2';

const gameOf = (difficulty: Difficulty): GameState => {
  const { puzzle, solution } = generatePuzzle(difficulty, 11);
  return createGame({ puzzle, solution, hints: 3 });
};

const save = (difficulty: Difficulty, overrides: Partial<SavedSoloGame> = {}): SavedSoloGame => {
  const entry: SavedSoloGame = {
    version: 2,
    difficulty,
    state: gameOf(difficulty),
    elapsedMs: 1000,
    savedAt: 1,
    ...overrides,
  };
  saveSoloGame(entry);
  return entry;
};

beforeEach(() => localStorage.clear());

describe('soloStorage', () => {
  it('keeps a slot per difficulty, so a new game never overwrites another one', () => {
    const medium = save('medium', { savedAt: 10 });
    save('easy', { savedAt: 20 });

    expect(loadSoloGame('medium')?.state.puzzle).toBe(medium.state.puzzle);
    expect(loadSoloGame('hard')).toBeNull();
  });

  it('clears only the difficulty that finished', () => {
    save('medium');
    save('easy');

    clearSoloGame('easy');

    expect(loadSoloGame('easy')).toBeNull();
    expect(loadSoloGame('medium')).not.toBeNull();
  });

  it('still restores a game left in the single slot of an older build', () => {
    const legacy: SavedSoloGame = {
      version: 2,
      difficulty: 'hard',
      state: gameOf('hard'),
      elapsedMs: 4200,
      savedAt: 5,
    };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    expect(loadSoloGame('hard')?.elapsedMs).toBe(4200);
    expect(loadSoloGame('easy')).toBeNull();
  });

  it('prefers its own slot over the legacy one and drops both when cleared', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ version: 2, difficulty: 'hard', state: gameOf('hard'), elapsedMs: 1, savedAt: 1 }),
    );
    const current = save('hard', { elapsedMs: 9000 });

    expect(loadSoloGame('hard')?.state.puzzle).toBe(current.state.puzzle);

    clearSoloGame('hard');
    expect(loadSoloGame('hard')).toBeNull();
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('ignores a finished game and forgets the flash of the last move', () => {
    const state = gameOf('easy');
    save('easy', { state: { ...state, flash: { index: 0, digit: 4, kind: 'locked', id: 1 } } });
    save('medium', { state: { ...gameOf('medium'), status: 'won' } });

    expect(loadSoloGame('easy')?.state.flash).toBeNull();
    expect(loadSoloGame('medium')).toBeNull();
  });

  it('names the difficulty saved most recently, so the home screen opens on it', () => {
    expect(latestSavedDifficulty()).toBeNull();

    save('easy', { savedAt: 100 });
    save('expert', { savedAt: 300 });
    save('medium', { savedAt: 200 });

    expect(latestSavedDifficulty()).toBe('expert');
  });
});
