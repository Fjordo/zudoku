import { DIFFICULTY_PROFILES, type Difficulty } from './difficulty.js';
import { CELL_COUNT, EMPTY_CELL, createEmptyGrid, gridToString, parseGrid, type Grid } from './grid.js';
import { solveLogically } from './logicalSolver.js';
import { createRng, randomSeed, shuffle, type Rng } from './random.js';
import { hasUniqueSolution, solveRandom } from './solver.js';
import type { TechniqueId } from './techniques.js';

export interface Puzzle {
  difficulty: Difficulty;
  seed: number;
  /** Starting grid, 81 chars with '.' for empty cells. */
  puzzle: string;
  /** The unique solution of `puzzle`. */
  solution: string;
  clues: number;
  /** Techniques a logical solve of this puzzle needs. */
  techniques: TechniqueId[];
  /** Hardest technique required, null when singles alone finish it. */
  hardest: TechniqueId | null;
}

export interface GenerateOptions {
  /** Candidate puzzles to try before returning the closest match. */
  maxAttempts?: number;
}

/**
 * Generates a puzzle with a unique solution, graded by the techniques a human
 * solver actually needs. Candidates that solve too easily for the requested
 * difficulty are rejected and the carve is retried with a new seed.
 */
export function generatePuzzle(
  difficulty: Difficulty,
  seed: number = randomSeed(),
  options: GenerateOptions = {},
): Puzzle {
  const profile = DIFFICULTY_PROFILES[difficulty];
  const maxAttempts = options.maxAttempts ?? 40;
  /** Solvable within the band but easier than requested. */
  let easierFallback: Puzzle | null = null;
  /** Valid puzzle that no allowed technique set cracks; last resort. */
  let lastResort: Puzzle | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = carve(difficulty, (seed + attempt * 7919) >>> 0);
    const grid = parseGrid(candidate.puzzle);

    // Must be solvable with this band's techniques...
    const withinBand = solveLogically(grid, { allowed: profile.allowed });
    if (!withinBand.solved) {
      lastResort ??= candidate;
      continue;
    }

    const graded: Puzzle = { ...candidate, techniques: withinBand.techniquesUsed, hardest: withinBand.hardest };

    // ...and must resist the previous, easier band.
    const tooEasy = profile.resists.length > 0 && solveLogically(grid, { allowed: profile.resists }).solved;
    if (tooEasy) {
      easierFallback ??= graded;
      continue;
    }
    return graded;
  }

  return easierFallback ?? lastResort ?? carve(difficulty, seed);
}

/** Removes clues from a complete grid while the solution stays unique. */
function carve(difficulty: Difficulty, seed: number): Puzzle {
  const rng: Rng = createRng(seed);
  const solution = solveRandom(createEmptyGrid(), rng);
  if (!solution) throw new Error('Failed to generate a complete grid');

  const { targetClues } = DIFFICULTY_PROFILES[difficulty];
  const puzzle: Grid = [...solution];
  let clues = CELL_COUNT;

  for (const index of shuffle(range(CELL_COUNT), rng)) {
    if (clues <= targetClues) break;
    const removed = puzzle[index];
    puzzle[index] = EMPTY_CELL;
    if (hasUniqueSolution(puzzle)) {
      clues -= 1;
    } else {
      puzzle[index] = removed;
    }
  }

  const report = solveLogically(puzzle);
  return {
    difficulty,
    seed,
    puzzle: gridToString(puzzle),
    solution: gridToString(solution),
    clues,
    techniques: report.techniquesUsed,
    hardest: report.hardest,
  };
}

const range = (length: number): number[] => Array.from({ length }, (_, index) => index);
