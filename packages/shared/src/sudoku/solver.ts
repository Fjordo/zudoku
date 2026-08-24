import {
  CELL_COUNT,
  DIGITS,
  EMPTY_CELL,
  PEERS,
  SIZE,
  cloneGrid,
  type Grid,
  type ReadonlyGrid,
} from './grid.js';
import { shuffle, type Rng } from './random.js';

export interface SolveResult {
  /** Number of solutions found, capped at the requested limit. */
  count: number;
  /** First solution found, if any. */
  solution: Grid | null;
}

/** Backtracking solver with minimum-remaining-values heuristic and bitmask candidates. */
export function solve(grid: ReadonlyGrid, options: { limit?: number; rng?: Rng } = {}): SolveResult {
  const limit = options.limit ?? 1;
  const working = cloneGrid(grid);
  const candidates = new Array<number>(CELL_COUNT).fill(0);

  if (!computeCandidates(working, candidates)) return { count: 0, solution: null };

  let count = 0;
  let solution: Grid | null = null;

  const search = (): boolean => {
    const target = pickCell(working, candidates);
    if (target === -1) {
      count += 1;
      solution ??= cloneGrid(working);
      return count >= limit;
    }

    let values = bitsToDigits(candidates[target]);
    if (options.rng) values = shuffle(values, options.rng);

    for (const value of values) {
      const undo = place(working, candidates, target, value);
      if (undo && search()) return true;
      restore(working, candidates, target, undo);
    }
    return false;
  };

  search();
  return { count, solution };
}

/** True when the puzzle has exactly one solution. */
export const hasUniqueSolution = (grid: ReadonlyGrid): boolean => solve(grid, { limit: 2 }).count === 1;

/** Generates a random complete grid. */
export function solveRandom(grid: ReadonlyGrid, rng: Rng): Grid | null {
  return solve(grid, { limit: 1, rng }).solution;
}

const ALL_DIGITS_MASK = 0b111111111;
const bitOf = (value: number): number => 1 << (value - 1);

function computeCandidates(grid: Grid, candidates: number[]): boolean {
  candidates.fill(ALL_DIGITS_MASK);
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = grid[index];
    if (value === EMPTY_CELL) continue;
    for (const peer of PEERS[index]) {
      if (grid[peer] === value) return false;
      candidates[peer] &= ~bitOf(value);
    }
  }
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] === EMPTY_CELL && candidates[index] === 0) return false;
  }
  return true;
}

/** Empty cell with the fewest candidates, or -1 when the grid is full. */
function pickCell(grid: ReadonlyGrid, candidates: readonly number[]): number {
  let best = -1;
  let bestCount = SIZE + 1;
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] !== EMPTY_CELL) continue;
    const count = popCount(candidates[index]);
    if (count < bestCount) {
      best = index;
      bestCount = count;
      if (count <= 1) break;
    }
  }
  return best;
}

/** Assigns a value and prunes peers; returns the pruned peers, or null on contradiction. */
function place(grid: Grid, candidates: number[], index: number, value: number): number[] | null {
  const bit = bitOf(value);
  const pruned: number[] = [];
  grid[index] = value;
  for (const peer of PEERS[index]) {
    if ((candidates[peer] & bit) === 0) continue;
    candidates[peer] &= ~bit;
    pruned.push(peer);
    if (grid[peer] === EMPTY_CELL && candidates[peer] === 0) {
      restore(grid, candidates, index, pruned);
      return null;
    }
  }
  return pruned;
}

function restore(grid: Grid, candidates: number[], index: number, pruned: number[] | null): void {
  if (!pruned) return;
  const bit = bitOf(grid[index]);
  for (const peer of pruned) candidates[peer] |= bit;
  grid[index] = EMPTY_CELL;
}

function bitsToDigits(mask: number): number[] {
  const values: number[] = [];
  for (const digit of DIGITS) {
    if (mask & bitOf(digit)) values.push(digit);
  }
  return values;
}

function popCount(mask: number): number {
  let count = 0;
  let bits = mask;
  while (bits) {
    bits &= bits - 1;
    count += 1;
  }
  return count;
}
