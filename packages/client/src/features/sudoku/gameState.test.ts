import { describe, expect, it } from 'vitest';
import { EMPTY_CELL, MAX_MISTAKES, generatePuzzle, indexOf, parseGrid, rowOf } from '@zudoku/shared';
import {
  computeHighlight,
  createGame,
  filledCount,
  gameReducer,
  hasNote,
  remainingForDigit,
  type GameAction,
  type GameState,
} from './gameState';

const generated = generatePuzzle('easy', 2024);
const solution = parseGrid(generated.solution);

const newGame = (): GameState =>
  createGame({ puzzle: generated.puzzle, solution: generated.solution, hints: 2 });

const run = (state: GameState, ...actions: GameAction[]): GameState =>
  actions.reduce(gameReducer, state);

/** First editable cell of the puzzle. */
const firstEmpty = (state: GameState): number => state.cells.findIndex((value) => value === EMPTY_CELL);

const wrongDigitFor = (index: number): number => (solution[index] % 9) + 1;

describe('createGame', () => {
  it('locks the clues and starts a clean run', () => {
    const state = newGame();
    expect(state.givens.filter(Boolean)).toHaveLength(generated.clues);
    expect(state.mistakes).toBe(0);
    expect(state.hintsLeft).toBe(2);
    expect(state.status).toBe('playing');
  });
});

describe('entering digits', () => {
  it('accepts a correct digit without counting a mistake', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const state = run(start, { type: 'select', index }, { type: 'input', digit: solution[index] });

    expect(state.cells[index]).toBe(solution[index]);
    expect(state.mistakes).toBe(0);
    expect(state.flash).toMatchObject({ index, digit: solution[index], kind: 'locked' });
    expect(filledCount(state)).toBe(generated.clues + 1);
  });

  it('keeps a placed digit for good', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const placed = run(start, { type: 'select', index }, { type: 'input', digit: solution[index] });
    const state = run(placed, { type: 'erase' }, { type: 'input', digit: wrongDigitFor(index) });

    expect(state.cells[index]).toBe(solution[index]);
    expect(state.mistakes).toBe(0);
  });

  it('refuses a wrong digit and leaves the cell empty', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const digit = wrongDigitFor(index);
    const state = run(start, { type: 'select', index }, { type: 'input', digit });

    expect(state.cells[index]).toBe(EMPTY_CELL);
    expect(state.mistakes).toBe(1);
    expect(state.flash).toMatchObject({ index, digit, kind: 'rejected' });
    expect(state.status).toBe('playing');
  });

  it('drops the flash once the board has played it', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const rejected = run(start, { type: 'select', index }, { type: 'input', digit: wrongDigitFor(index) });
    const state = run(rejected, { type: 'clear_flash', id: rejected.flash?.id ?? 0 });

    expect(state.flash).toBeNull();
  });

  it('ends the game after three mistakes', () => {
    let state = newGame();
    const empties = state.cells
      .map((value, index) => (value === EMPTY_CELL ? index : -1))
      .filter((index) => index !== -1)
      .slice(0, MAX_MISTAKES);

    for (const index of empties) {
      state = run(state, { type: 'select', index }, { type: 'input', digit: wrongDigitFor(index) });
    }

    expect(state.mistakes).toBe(MAX_MISTAKES);
    expect(state.status).toBe('lost');
  });

  it('refuses to overwrite a clue', () => {
    const start = newGame();
    const given = start.cells.findIndex((value) => value !== EMPTY_CELL);
    const state = run(start, { type: 'select', index: given }, { type: 'input', digit: 5 });

    expect(state.cells[given]).toBe(start.cells[given]);
    expect(state.mistakes).toBe(0);
  });

  it('wins when the grid matches the solution', () => {
    let state = newGame();
    state.cells.forEach((value, index) => {
      if (value === EMPTY_CELL) {
        state = run(state, { type: 'select', index }, { type: 'input', digit: solution[index] });
      }
    });

    expect(state.status).toBe('won');
    expect(remainingForDigit(state, 4)).toBe(0);
  });
});

describe('notes', () => {
  it('toggles pencil marks without touching the value', () => {
    const start = newGame();
    const index = firstEmpty(start);
    let state = run(start, { type: 'toggle_notes' }, { type: 'select', index }, { type: 'input', digit: 4 });

    expect(state.cells[index]).toBe(EMPTY_CELL);
    expect(hasNote(state.notes[index], 4)).toBe(true);

    state = run(state, { type: 'input', digit: 4 });
    expect(hasNote(state.notes[index], 4)).toBe(false);
  });

  it('clears the same note from peers when a digit is confirmed', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const digit = solution[index];
    const peer = start.cells.findIndex(
      (value, other) => value === EMPTY_CELL && other !== index && rowOf(other) === rowOf(index),
    );

    const state = run(
      start,
      { type: 'toggle_notes' },
      { type: 'select', index: peer },
      { type: 'input', digit },
      { type: 'toggle_notes' },
      { type: 'select', index },
      { type: 'input', digit },
    );

    expect(hasNote(state.notes[peer], digit)).toBe(false);
  });
});

describe('undo', () => {
  it('walks back a pencil mark', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const marked = run(start, { type: 'toggle_notes' }, { type: 'select', index }, { type: 'input', digit: 4 });
    const state = run(marked, { type: 'undo' });

    expect(hasNote(state.notes[index], 4)).toBe(false);
    expect(state.history).toHaveLength(0);
  });

  it('never gives back a spent life', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const state = run(
      start,
      { type: 'toggle_notes' },
      { type: 'select', index },
      { type: 'input', digit: 4 },
      { type: 'toggle_notes' },
      { type: 'input', digit: wrongDigitFor(index) },
      { type: 'undo' },
    );

    expect(state.mistakes).toBe(1);
  });
});

describe('hints', () => {
  it('explains the next logical step and consumes a hint', () => {
    const state = run(newGame(), { type: 'hint' });

    expect(state.hintsLeft).toBe(1);
    expect(state.hint?.kind).toBe('step');
    expect(state.hint?.kind === 'step' && state.hint.step.technique).toBeTruthy();
    const placed = state.cells.findIndex((value, index) => state.hinted[index] && value !== EMPTY_CELL);
    expect(placed).toBeGreaterThanOrEqual(0);
    expect(state.cells[placed]).toBe(solution[placed]);
  });

  it('stops giving hints once they run out', () => {
    let state = createGame({ puzzle: generated.puzzle, solution: generated.solution, hints: 0 });
    state = run(state, { type: 'hint' });
    expect(state.hint).toBeNull();
  });
});

describe('highlight', () => {
  it('lights the cells holding the digit and nothing else', () => {
    const state = run(newGame(), { type: 'highlight', digit: 5 });
    const highlight = computeHighlight(state);
    const matches = [...highlight.matches];

    expect(matches.length).toBeGreaterThan(0);
    for (const index of matches) expect(state.cells[index]).toBe(5);
    // A cell sharing a row with a 5 stays dark unless it holds one itself.
    const onSameRow = state.cells.findIndex(
      (value, index) => value !== 5 && matches.some((match) => rowOf(match) === rowOf(index)),
    );
    expect(highlight.matches.has(onSameRow)).toBe(false);
  });

  it('reads the row and column of the selected cell', () => {
    const selected = indexOf(4, 4);
    const state = run(newGame(), { type: 'select', index: selected });
    const highlight = computeHighlight(state);

    expect(highlight.related.has(indexOf(4, 0))).toBe(true);
    expect(highlight.related.has(indexOf(0, 4))).toBe(true);
    // The box no longer counts, and neither does the cell itself.
    expect(highlight.related.has(indexOf(3, 3))).toBe(false);
    expect(highlight.related.has(selected)).toBe(false);

    for (const index of highlight.placed) {
      expect(highlight.related.has(index)).toBe(true);
      expect(state.cells[index]).not.toBe(EMPTY_CELL);
    }
  });

  it('puts no digit in play when an empty cell is selected', () => {
    const start = newGame();
    const state = run(start, { type: 'highlight', digit: 5 }, { type: 'select', index: firstEmpty(start) });

    expect(state.activeDigit).toBeNull();
    expect(computeHighlight(state).matches.size).toBe(0);
  });
});
