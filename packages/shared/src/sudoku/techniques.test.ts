import { describe, expect, it } from 'vitest';
import { ALL_DIGITS_MASK, type Candidates } from './candidates.js';
import { DIFFICULTIES, DIFFICULTY_PROFILES } from './difficulty.js';
import { generatePuzzle } from './generator.js';
import { CELL_COUNT, createEmptyGrid, indexOf, parseGrid, type Grid } from './grid.js';
import { solveLogically } from './logicalSolver.js';
import {
  findBoxLineReduction,
  findHiddenPair,
  findHiddenSingle,
  findNakedPair,
  findNakedSingle,
  findPointingPair,
  findSwordfish,
  findXWing,
  findXyWing,
} from './techniques.js';

const maskOf = (digits: number[]): number => digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);

/** Builds a candidate grid: listed cells get the given digits, the rest are treated as filled. */
function candidatesOf(spec: Record<number, number[]>, fillRest = false): Candidates {
  const candidates: Candidates = new Array<number>(CELL_COUNT).fill(fillRest ? ALL_DIGITS_MASK : 0);
  for (const [cell, digits] of Object.entries(spec)) candidates[Number(cell)] = maskOf(digits);
  return candidates;
}

const EMPTY: Grid = createEmptyGrid();
const at = indexOf;

describe('singles', () => {
  it('finds a naked single', () => {
    const candidates = candidatesOf({ [at(0, 0)]: [7], [at(0, 1)]: [3, 4] });
    const step = findNakedSingle(EMPTY, candidates);
    expect(step).toMatchObject({ technique: 'naked_single', placements: [{ index: at(0, 0), digit: 7 }] });
  });

  it('finds a hidden single in a row', () => {
    const row = Object.fromEntries(
      Array.from({ length: 9 }, (_, col) => [at(0, col), col === 4 ? [2, 3, 7] : [2, 3]]),
    );
    const step = findHiddenSingle(EMPTY, candidatesOf(row));
    expect(step).toMatchObject({ technique: 'hidden_single', placements: [{ index: at(0, 4), digit: 7 }] });
  });
});

describe('subsets', () => {
  it('finds a naked pair and eliminates its digits from the unit', () => {
    const candidates = candidatesOf({
      [at(0, 0)]: [4, 5],
      [at(0, 1)]: [4, 5],
      [at(0, 2)]: [4, 5, 6],
      [at(0, 3)]: [5, 8],
    });
    const step = findNakedPair(EMPTY, candidates);
    expect(step?.technique).toBe('naked_pair');
    expect(step?.cells).toEqual([at(0, 0), at(0, 1)]);
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { index: at(0, 2), digit: 4 },
        { index: at(0, 2), digit: 5 },
        { index: at(0, 3), digit: 5 },
      ]),
    );
  });

  it('finds a hidden pair and strips the extra candidates', () => {
    const candidates = candidatesOf({
      [at(0, 0)]: [1, 2, 6, 7],
      [at(0, 1)]: [1, 2, 8],
      [at(0, 2)]: [6, 7, 8],
      [at(0, 3)]: [6, 7],
    });
    const step = findHiddenPair(EMPTY, candidates);
    expect(step?.technique).toBe('hidden_pair');
    expect(step?.digits).toEqual([1, 2]);
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { index: at(0, 0), digit: 6 },
        { index: at(0, 0), digit: 7 },
        { index: at(0, 1), digit: 8 },
      ]),
    );
  });
});

describe('box and line interactions', () => {
  it('finds a pointing pair', () => {
    const candidates = candidatesOf({
      [at(0, 0)]: [7, 1],
      [at(0, 1)]: [7, 2],
      [at(1, 0)]: [1, 2],
      [at(0, 5)]: [7, 3],
      [at(0, 8)]: [7, 4],
    });
    const step = findPointingPair(EMPTY, candidates);
    expect(step?.technique).toBe('pointing_pair');
    expect(step?.digits).toEqual([7]);
    expect(step?.eliminations).toEqual([
      { index: at(0, 5), digit: 7 },
      { index: at(0, 8), digit: 7 },
    ]);
  });

  it('finds a box/line reduction', () => {
    const candidates = candidatesOf({
      [at(0, 0)]: [7, 1],
      [at(0, 2)]: [7, 2],
      [at(1, 1)]: [7, 3],
      [at(2, 2)]: [7, 4],
      [at(0, 4)]: [1, 2],
    });
    const step = findBoxLineReduction(EMPTY, candidates);
    expect(step?.technique).toBe('box_line_reduction');
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { index: at(1, 1), digit: 7 },
        { index: at(2, 2), digit: 7 },
      ]),
    );
  });
});

describe('fish and wings', () => {
  it('finds an X-Wing across two rows', () => {
    const candidates = candidatesOf({
      [at(0, 2)]: [4, 1],
      [at(0, 7)]: [4, 2],
      [at(4, 2)]: [4, 3],
      [at(4, 7)]: [4, 5],
      // Extra 4s in the shared columns are the ones the pattern removes.
      [at(6, 2)]: [4, 6, 8],
      [at(7, 7)]: [4, 6, 9],
    });
    const step = findXWing(EMPTY, candidates);
    expect(step?.technique).toBe('x_wing');
    expect(step?.eliminations).toEqual(
      expect.arrayContaining([
        { index: at(6, 2), digit: 4 },
        { index: at(7, 7), digit: 4 },
      ]),
    );
  });

  it('finds a Swordfish across three rows', () => {
    const candidates = candidatesOf({
      [at(0, 0)]: [5, 1],
      [at(0, 1)]: [5, 2],
      [at(3, 1)]: [5, 3],
      [at(3, 2)]: [5, 4],
      [at(6, 0)]: [5, 6],
      [at(6, 2)]: [5, 7],
      [at(8, 1)]: [5, 8, 9],
    });
    const step = findSwordfish(EMPTY, candidates);
    expect(step?.technique).toBe('swordfish');
    expect(step?.eliminations).toEqual([{ index: at(8, 1), digit: 5 }]);
  });

  it('finds an XY-Wing and removes the shared digit', () => {
    const candidates = candidatesOf({
      [at(1, 1)]: [1, 2], // pivot
      [at(1, 5)]: [1, 3], // pincer sharing the row
      [at(5, 1)]: [2, 3], // pincer sharing the column
      [at(5, 5)]: [3, 9], // sees both pincers
    });
    const step = findXyWing(EMPTY, candidates);
    expect(step?.technique).toBe('xy_wing');
    expect(step?.cells).toEqual([at(1, 1), at(1, 5), at(5, 1)]);
    expect(step?.eliminations).toEqual([{ index: at(5, 5), digit: 3 }]);
  });
});

describe('logical solver', () => {
  it('produces only sound steps on generated puzzles', () => {
    for (const difficulty of DIFFICULTIES) {
      const generated = generatePuzzle(difficulty, 777);
      const solution = parseGrid(generated.solution);
      const report = solveLogically(parseGrid(generated.puzzle));

      for (const step of report.steps) {
        for (const placement of step.placements) {
          expect(placement.digit).toBe(solution[placement.index]);
        }
        for (const elimination of step.eliminations) {
          // A sound elimination never removes the digit the solution needs.
          expect(elimination.digit).not.toBe(solution[elimination.index]);
        }
      }
      expect(report.solved).toBe(true);
      expect(report.grid).toEqual(solution);
    }
  });

  it('needs an X-Wing to finish a puzzle built around one', () => {
    const puzzle = '....3..74..1......7.3..4.2....2...8....1..2...4.5....116.3..4..37..9...585.......';
    const report = solveLogically(parseGrid(puzzle));
    expect(report.solved).toBe(true);
    expect(report.techniquesUsed).toContain('x_wing');
    expect(solveLogically(parseGrid(puzzle), { allowed: DIFFICULTY_PROFILES.medium.allowed }).solved).toBe(false);
  });

  it('grades each difficulty by the techniques it requires', () => {
    for (const difficulty of DIFFICULTIES) {
      const generated = generatePuzzle(difficulty, 31337);
      const profile = DIFFICULTY_PROFILES[difficulty];
      const puzzle = parseGrid(generated.puzzle);

      expect(solveLogically(puzzle, { allowed: profile.allowed }).solved).toBe(true);
      if (profile.resists.length > 0) {
        expect(solveLogically(puzzle, { allowed: profile.resists }).solved).toBe(false);
      }
    }
  });
});
