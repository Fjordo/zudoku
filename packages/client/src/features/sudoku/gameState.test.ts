import { describe, expect, it } from 'vitest';
import { EMPTY_CELL, MAX_MISTAKES, generatePuzzle, indexOf, parseGrid, rowOf } from '@zudoku/shared';
import {
  computeHighlight,
  createGame,
  filledCount,
  gameReducer,
  hasNote,
  hintCells,
  isWrong,
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
    expect(isWrong(state, index)).toBe(false);
    expect(filledCount(state)).toBe(generated.clues + 1);
  });

  it('counts a wrong digit and marks the cell', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const state = run(start, { type: 'select', index }, { type: 'input', digit: wrongDigitFor(index) });

    expect(state.mistakes).toBe(1);
    expect(isWrong(state, index)).toBe(true);
    expect(state.status).toBe('playing');
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

    let state = run(
      start,
      { type: 'toggle_notes' },
      { type: 'select', index: peer },
      { type: 'input', digit },
      { type: 'toggle_notes' },
      { type: 'select', index },
      { type: 'input', digit },
    );

    expect(hasNote(state.notes[peer], digit)).toBe(false);
    state = run(state, { type: 'undo' });
    expect(state.cells[index]).toBe(EMPTY_CELL);
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

  it('asks the player to clear a wrong digit before continuing', () => {
    const start = newGame();
    const index = firstEmpty(start);
    const state = run(
      start,
      { type: 'select', index },
      { type: 'input', digit: wrongDigitFor(index) },
      { type: 'hint' },
    );

    expect(state.hint).toEqual({ kind: 'wrong', index, digit: wrongDigitFor(index) });
    expect(hintCells(state.hint)).toEqual([index]);
  });

  it('stops giving hints once they run out', () => {
    let state = createGame({ puzzle: generated.puzzle, solution: generated.solution, hints: 0 });
    state = run(state, { type: 'hint' });
    expect(state.hint).toBeNull();
  });
});

describe('highlight', () => {
  it('lights matching cells and the lines they sit on', () => {
    const state = run(newGame(), { type: 'highlight', digit: 5 });
    const highlight = computeHighlight(state);
    const matches = [...highlight.matches];

    expect(matches.length).toBeGreaterThan(0);
    for (const index of matches) {
      expect(state.cells[index]).toBe(5);
      // Every cell of a matched row is lit.
      expect(highlight.lines.has(indexOf(rowOf(index), 0))).toBe(true);
    }
  });

  it('relates the selected cell to its own units', () => {
    const state = run(newGame(), { type: 'select', index: indexOf(4, 4) });
    const highlight = computeHighlight(state);

    expect(highlight.related.has(indexOf(4, 0))).toBe(true);
    expect(highlight.related.has(indexOf(0, 4))).toBe(true);
    expect(highlight.related.has(indexOf(0, 0))).toBe(false);
  });
});
