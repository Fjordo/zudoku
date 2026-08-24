/** Solves the way a person would: apply the cheapest technique that fires, repeat. */
import { bitOf, computeCandidates, type Candidates } from './candidates.js';
import { CELL_COUNT, EMPTY_CELL, PEERS, cloneGrid, isSolved, type Grid, type ReadonlyGrid } from './grid.js';
import { TECHNIQUE_BY_ID, TECHNIQUES, type Step, type TechniqueId } from './techniques.js';

export interface LogicalSolveReport {
  solved: boolean;
  steps: Step[];
  techniquesUsed: TechniqueId[];
  /** Hardest technique the solve needed, null when the grid was already solved. */
  hardest: TechniqueId | null;
  /** Sum of the technique costs, a rough measure of effort. */
  score: number;
  grid: Grid;
}

export interface LogicalSolveOptions {
  /** Techniques the solver may use, cheapest first. Defaults to all of them. */
  allowed?: readonly TechniqueId[];
  maxSteps?: number;
}

export function solveLogically(grid: ReadonlyGrid, options: LogicalSolveOptions = {}): LogicalSolveReport {
  const allowed = options.allowed
    ? TECHNIQUES.filter((technique) => options.allowed?.includes(technique.id))
    : TECHNIQUES;
  const maxSteps = options.maxSteps ?? 200;

  const working = cloneGrid(grid);
  const candidates = computeCandidates(working);
  const steps: Step[] = [];

  while (steps.length < maxSteps && !isSolved(working)) {
    const step = firstStep(working, candidates, allowed);
    if (!step) break;
    applyStep(working, candidates, step);
    steps.push(step);
  }

  const techniquesUsed = [...new Set(steps.map((step) => step.technique))];
  const hardest = techniquesUsed.reduce<TechniqueId | null>(
    (worst, id) => (worst === null || TECHNIQUE_BY_ID[id].cost > TECHNIQUE_BY_ID[worst].cost ? id : worst),
    null,
  );

  return {
    solved: isSolved(working),
    steps,
    techniquesUsed,
    hardest,
    score: steps.reduce((total, step) => total + TECHNIQUE_BY_ID[step.technique].cost, 0),
    grid: working,
  };
}

/** The next logical move for the current board, used by the hint system. */
export function findNextStep(grid: ReadonlyGrid): Step | null {
  return firstStep(grid, computeCandidates(grid), TECHNIQUES);
}

/** Applies a step in place, keeping the candidate masks in sync. */
export function applyStep(grid: Grid, candidates: Candidates, step: Step): void {
  for (const { index, digit } of step.placements) {
    grid[index] = digit;
    candidates[index] = 0;
    for (const peer of PEERS[index]) candidates[peer] &= ~bitOf(digit);
  }
  for (const { index, digit } of step.eliminations) {
    candidates[index] &= ~bitOf(digit);
  }
}

/** True when the puzzle can be finished with the given techniques alone. */
export const isSolvableWith = (grid: ReadonlyGrid, allowed: readonly TechniqueId[]): boolean =>
  solveLogically(grid, { allowed }).solved;

function firstStep(
  grid: ReadonlyGrid,
  candidates: Candidates,
  techniques: readonly (typeof TECHNIQUES)[number][],
): Step | null {
  if (hasContradiction(grid, candidates)) return null;
  for (const technique of techniques) {
    const step = technique.find(grid, candidates);
    if (step) return step;
  }
  return null;
}

const hasContradiction = (grid: ReadonlyGrid, candidates: Candidates): boolean => {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] === EMPTY_CELL && candidates[index] === 0) return true;
  }
  return false;
};
