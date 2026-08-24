import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, DIFFICULTY_PROFILES } from './difficulty.js';
import { generatePuzzle } from './generator.js';
import {
  CELL_COUNT,
  createEmptyGrid,
  findConflicts,
  gridToString,
  indexOf,
  isPlacementValid,
  isSolved,
  parseGrid,
  PEERS,
} from './grid.js';
import { createRng } from './random.js';
import { hasUniqueSolution, solve, solveRandom } from './solver.js';

describe('grid', () => {
  it('gives every cell 20 peers', () => {
    expect(PEERS).toHaveLength(CELL_COUNT);
    for (const peers of PEERS) expect(peers).toHaveLength(20);
  });

  it('round-trips through string serialization', () => {
    const grid = solveRandom(createEmptyGrid(), createRng(7))!;
    expect(parseGrid(gridToString(grid))).toEqual(grid);
  });

  it('rejects malformed strings', () => {
    expect(() => parseGrid('123')).toThrow();
    expect(() => parseGrid('x'.repeat(CELL_COUNT))).toThrow();
  });

  it('detects conflicts and invalid placements', () => {
    const grid = createEmptyGrid();
    grid[indexOf(0, 0)] = 5;
    expect(isPlacementValid(grid, indexOf(0, 8), 5)).toBe(false);
    expect(isPlacementValid(grid, indexOf(4, 4), 5)).toBe(true);
    grid[indexOf(0, 8)] = 5;
    expect(findConflicts(grid)).toEqual(new Set([indexOf(0, 0), indexOf(0, 8)]));
  });
});

describe('solver', () => {
  it('solves a known puzzle', () => {
    const puzzle = parseGrid(
      '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79',
    );
    const { solution, count } = solve(puzzle, { limit: 2 });
    expect(count).toBe(1);
    expect(isSolved(solution!)).toBe(true);
    expect(solution!.slice(0, 3)).toEqual([5, 3, 4]);
  });

  it('reports zero solutions for a contradictory grid', () => {
    const grid = createEmptyGrid();
    grid[0] = 1;
    grid[1] = 1;
    expect(solve(grid).count).toBe(0);
  });

  it('counts multiple solutions for an under-constrained grid', () => {
    expect(solve(createEmptyGrid(), { limit: 5 }).count).toBe(5);
  });

  it('is deterministic for a given seed', () => {
    const first = solveRandom(createEmptyGrid(), createRng(42));
    const second = solveRandom(createEmptyGrid(), createRng(42));
    expect(first).toEqual(second);
  });
});

describe('generator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces a uniquely solvable ${difficulty} puzzle`, () => {
      const generated = generatePuzzle(difficulty, 12345);
      const puzzle = parseGrid(generated.puzzle);
      const solution = parseGrid(generated.solution);

      expect(isSolved(solution)).toBe(true);
      expect(hasUniqueSolution(puzzle)).toBe(true);
      expect(generated.clues).toBe(puzzle.filter((value) => value !== 0).length);
      expect(generated.clues).toBeLessThanOrEqual(DIFFICULTY_PROFILES[difficulty].targetClues + 6);
      puzzle.forEach((value, index) => {
        if (value !== 0) expect(value).toBe(solution[index]);
      });
    });
  }

  it('gives harder difficulties fewer clues', () => {
    const easy = generatePuzzle('easy', 99);
    const hard = generatePuzzle('hard', 99);
    expect(hard.clues).toBeLessThan(easy.clues);
  });

  it('is reproducible from its seed', () => {
    expect(generatePuzzle('medium', 2024)).toEqual(generatePuzzle('medium', 2024));
  });
});
