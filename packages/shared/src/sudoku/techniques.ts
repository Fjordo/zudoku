/**
 * Human-style solving techniques.
 *
 * Every finder inspects a grid plus its candidate masks and returns a single
 * step: the pattern it found, the digits it can place and the candidates it can
 * eliminate. The same steps power difficulty grading and in-game hints.
 */
import {
  BOXES,
  COLUMNS,
  ROWS,
  UNITS,
  type Candidates,
  type Unit,
  type UnitKind,
  cellName,
  cellNames,
  cellsWithCandidate,
  countBits,
  digitsOf,
  hasCandidate,
  unitName,
} from './candidates.js';
import { CELL_COUNT, EMPTY_CELL, PEERS, SIZE, boxOf, colOf, rowOf, type ReadonlyGrid } from './grid.js';

export type TechniqueId =
  | 'naked_single'
  | 'hidden_single'
  | 'naked_pair'
  | 'hidden_pair'
  | 'naked_triple'
  | 'pointing_pair'
  | 'box_line_reduction'
  | 'x_wing'
  | 'xy_wing'
  | 'swordfish';

export interface Placement {
  index: number;
  digit: number;
}

export interface Elimination {
  index: number;
  digit: number;
}

/** Identifies the unit a step reasons about, so callers can name it in any language. */
export interface UnitRef {
  kind: UnitKind;
  /** 0-based position within its kind. */
  position: number;
}

export interface Step {
  technique: TechniqueId;
  /** Digits the step is about. */
  digits: number[];
  /** Cells that form the pattern, used to highlight the explanation. */
  cells: number[];
  placements: Placement[];
  eliminations: Elimination[];
  /** Row, column or box the step reasons about, when it involves one. */
  unit: UnitRef | null;
  /** English sentence; localized clients rebuild it from the structured fields. */
  description: string;
}

const refOf = (unit: Unit): UnitRef => ({ kind: unit.kind, position: unit.position });

export interface TechniqueDefinition {
  id: TechniqueId;
  label: string;
  /** Relative cost; the grader uses the highest cost reached. */
  cost: number;
  find: (grid: ReadonlyGrid, candidates: Candidates) => Step | null;
}

/* ------------------------------------------------------------------ singles */

/** A cell with a single remaining candidate. */
export function findNakedSingle(grid: ReadonlyGrid, candidates: Candidates): Step | null {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] !== EMPTY_CELL || countBits(candidates[index]) !== 1) continue;
    const digit = digitsOf(candidates[index])[0];
    return {
      technique: 'naked_single',
      digits: [digit],
      cells: [index],
      placements: [{ index, digit }],
      eliminations: [],
      unit: null,
      description: `${cellName(index)} has only one candidate left: ${digit}.`,
    };
  }
  return null;
}

/** A digit that fits in exactly one cell of a unit. */
export function findHiddenSingle(grid: ReadonlyGrid, candidates: Candidates): Step | null {
  for (const unit of UNITS) {
    for (let digit = 1; digit <= SIZE; digit += 1) {
      if (unit.cells.some((cell) => grid[cell] === digit)) continue;
      const spots = cellsWithCandidate(unit, candidates, digit);
      if (spots.length !== 1) continue;
      const index = spots[0];
      if (countBits(candidates[index]) === 1) continue; // already a naked single
      return {
        technique: 'hidden_single',
        digits: [digit],
        cells: [index],
        placements: [{ index, digit }],
        eliminations: [],
        unit: refOf(unit),
        description: `${digit} fits only in ${cellName(index)} within ${unitName(unit)}.`,
      };
    }
  }
  return null;
}

/* ----------------------------------------------------------------- subsets */

const nakedSubset = (size: number, technique: TechniqueId) =>
  function find(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
    for (const unit of UNITS) {
      const open = unit.cells.filter((cell) => candidates[cell] !== 0);
      for (const group of combinations(open, size)) {
        const union = group.reduce((mask, cell) => mask | candidates[cell], 0);
        if (countBits(union) !== size) continue;

        const digits = digitsOf(union);
        const eliminations: Elimination[] = [];
        for (const cell of open) {
          if (group.includes(cell)) continue;
          for (const digit of digits) {
            if (hasCandidate(candidates[cell], digit)) eliminations.push({ index: cell, digit });
          }
        }
        if (eliminations.length === 0) continue;
        return {
          technique,
          digits,
          cells: group,
          placements: [],
          eliminations,
          unit: refOf(unit),
          description: `${cellNames(group)} in ${unitName(unit)} can only hold ${digits.join(
            '/',
          )}, so those digits leave the rest of the unit.`,
        };
      }
    }
    return null;
  };

export const findNakedPair = nakedSubset(2, 'naked_pair');
export const findNakedTriple = nakedSubset(3, 'naked_triple');

/** Two digits confined to the same two cells of a unit; other candidates there go. */
export function findHiddenPair(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
  for (const unit of UNITS) {
    const open = unit.cells.filter((cell) => candidates[cell] !== 0);
    const digits = range1to9().filter((digit) => cellsWithCandidate(unit, candidates, digit).length > 0);

    for (const [first, second] of combinations(digits, 2)) {
      const cells = open.filter(
        (cell) => hasCandidate(candidates[cell], first) || hasCandidate(candidates[cell], second),
      );
      if (cells.length !== 2) continue;
      if (!cells.every((cell) => hasCandidate(candidates[cell], first) && hasCandidate(candidates[cell], second)))
        continue;

      const eliminations: Elimination[] = [];
      for (const cell of cells) {
        for (const digit of digitsOf(candidates[cell])) {
          if (digit !== first && digit !== second) eliminations.push({ index: cell, digit });
        }
      }
      if (eliminations.length === 0) continue;
      return {
        technique: 'hidden_pair',
        digits: [first, second],
        cells,
        placements: [],
        eliminations,
        unit: refOf(unit),
        description: `${first} and ${second} fit only in ${cellNames(cells)} of ${unitName(
          unit,
        )}, so nothing else fits there.`,
      };
    }
  }
  return null;
}

/* ------------------------------------------------- box / line interactions */

/** A digit confined to one row or column inside a box: it leaves the rest of that line. */
export function findPointingPair(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
  for (const box of BOXES) {
    for (let digit = 1; digit <= SIZE; digit += 1) {
      const spots = cellsWithCandidate(box, candidates, digit);
      if (spots.length < 2 || spots.length > 3) continue;

      const line = sharedLine(spots);
      if (!line) continue;
      const eliminations = line.cells
        .filter((cell) => boxOf(cell) !== box.position && hasCandidate(candidates[cell], digit))
        .map((cell) => ({ index: cell, digit }));
      if (eliminations.length === 0) continue;

      return {
        technique: 'pointing_pair',
        digits: [digit],
        cells: spots,
        placements: [],
        eliminations,
        unit: refOf(box),
        description: `In ${unitName(box)}, ${digit} only fits on ${unitName(line)} (${cellNames(
          spots,
        )}), so it leaves the rest of that line.`,
      };
    }
  }
  return null;
}

/** A digit confined to one box inside a row or column: it leaves the rest of that box. */
export function findBoxLineReduction(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
  for (const line of [...ROWS, ...COLUMNS]) {
    for (let digit = 1; digit <= SIZE; digit += 1) {
      const spots = cellsWithCandidate(line, candidates, digit);
      if (spots.length < 2 || spots.length > 3) continue;

      const box = boxOf(spots[0]);
      if (!spots.every((cell) => boxOf(cell) === box)) continue;

      const eliminations = BOXES[box].cells
        .filter((cell) => !spots.includes(cell) && hasCandidate(candidates[cell], digit))
        .map((cell) => ({ index: cell, digit }));
      if (eliminations.length === 0) continue;

      return {
        technique: 'box_line_reduction',
        digits: [digit],
        cells: spots,
        placements: [],
        eliminations,
        unit: refOf(line),
        description: `On ${unitName(line)}, ${digit} only fits inside ${unitName(
          BOXES[box],
        )}, so it leaves the other cells of that box.`,
      };
    }
  }
  return null;
}

/* --------------------------------------------------------------------- fish */

/**
 * Generic fish: `size` base lines where a digit sits in the same `size` cross
 * lines. X-Wing is size 2, Swordfish size 3.
 */
const fish = (size: number, technique: TechniqueId) =>
  function find(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
    for (const orientation of ['row', 'column'] as const) {
      const bases = orientation === 'row' ? ROWS : COLUMNS;
      const covers = orientation === 'row' ? COLUMNS : ROWS;
      const crossOf = orientation === 'row' ? colOf : rowOf;

      for (let digit = 1; digit <= SIZE; digit += 1) {
        const usable = bases
          .map((unit) => ({ unit, spots: cellsWithCandidate(unit, candidates, digit) }))
          .filter(({ spots }) => spots.length >= 2 && spots.length <= size);

        for (const group of combinations(usable, size)) {
          const crossLines = new Set(group.flatMap(({ spots }) => spots.map(crossOf)));
          if (crossLines.size !== size) continue;

          const patternCells = group.flatMap(({ spots }) => spots);
          const eliminations: Elimination[] = [];
          for (const cross of crossLines) {
            for (const cell of covers[cross].cells) {
              if (patternCells.includes(cell) || !hasCandidate(candidates[cell], digit)) continue;
              eliminations.push({ index: cell, digit });
            }
          }
          if (eliminations.length === 0) continue;

          return {
            technique,
            digits: [digit],
            cells: patternCells,
            placements: [],
            eliminations,
            unit: null,
            description: `${digit} forms a ${technique === 'x_wing' ? 'X-Wing' : 'Swordfish'} on ${cellNames(
              patternCells,
            )}, so it leaves the crossing ${orientation === 'row' ? 'columns' : 'rows'}.`,
          };
        }
      }
    }
    return null;
  };

export const findXWing = fish(2, 'x_wing');
export const findSwordfish = fish(3, 'swordfish');

/**
 * XY-Wing: a pivot {x,y} sees two pincers {x,z} and {y,z}. Whichever value the
 * pivot takes, one pincer becomes z, so z leaves every cell both pincers see.
 */
export function findXyWing(_grid: ReadonlyGrid, candidates: Candidates): Step | null {
  const bivalue = allCells().filter((cell) => countBits(candidates[cell]) === 2);

  for (const pivot of bivalue) {
    const [x, y] = digitsOf(candidates[pivot]);
    const pincers = PEERS[pivot].filter((cell) => countBits(candidates[cell]) === 2);

    for (const first of pincers) {
      for (const second of pincers) {
        if (first >= second) continue;
        const z = wingDigit(digitsOf(candidates[first]), digitsOf(candidates[second]), x, y);
        if (z === null) continue;

        const eliminations = PEERS[first]
          .filter(
            (cell) =>
              cell !== pivot &&
              cell !== second &&
              PEERS[second].includes(cell) &&
              hasCandidate(candidates[cell], z),
          )
          .map((cell) => ({ index: cell, digit: z }));
        if (eliminations.length === 0) continue;

        return {
          technique: 'xy_wing',
          digits: [x, y, z],
          cells: [pivot, first, second],
          placements: [],
          eliminations,
          unit: null,
          description: `XY-Wing: pivot ${cellName(pivot)} (${x}${y}) with ${cellName(first)} and ${cellName(
            second,
          )} forces ${z} out of the cells both wings see.`,
        };
      }
    }
  }
  return null;
}

/** Returns z when the two pincers are {x,z} and {y,z} for the pivot digits x and y. */
function wingDigit(first: number[], second: number[], x: number, y: number): number | null {
  const matches = (pincer: number[], anchor: number): number | null => {
    if (!pincer.includes(anchor)) return null;
    const other = pincer.find((digit) => digit !== anchor);
    return other !== undefined && other !== x && other !== y ? other : null;
  };
  const direct = matches(first, x);
  if (direct !== null && matches(second, y) === direct) return direct;
  const swapped = matches(first, y);
  if (swapped !== null && matches(second, x) === swapped) return swapped;
  return null;
}

/* ---------------------------------------------------------------- registry */

/** Ordered from cheapest to hardest; solvers try them in this order. */
export const TECHNIQUES: readonly TechniqueDefinition[] = [
  { id: 'naked_single', label: 'Naked single', cost: 1, find: findNakedSingle },
  { id: 'hidden_single', label: 'Hidden single', cost: 2, find: findHiddenSingle },
  { id: 'naked_pair', label: 'Naked pair', cost: 4, find: findNakedPair },
  { id: 'hidden_pair', label: 'Hidden pair', cost: 5, find: findHiddenPair },
  { id: 'pointing_pair', label: 'Pointing pair', cost: 5, find: findPointingPair },
  { id: 'box_line_reduction', label: 'Box/line reduction', cost: 5, find: findBoxLineReduction },
  { id: 'naked_triple', label: 'Naked triple', cost: 6, find: findNakedTriple },
  { id: 'x_wing', label: 'X-Wing', cost: 8, find: findXWing },
  { id: 'xy_wing', label: 'XY-Wing', cost: 9, find: findXyWing },
  { id: 'swordfish', label: 'Swordfish', cost: 10, find: findSwordfish },
];

export const TECHNIQUE_BY_ID: Record<TechniqueId, TechniqueDefinition> = Object.fromEntries(
  TECHNIQUES.map((technique) => [technique.id, technique]),
) as Record<TechniqueId, TechniqueDefinition>;

/* ----------------------------------------------------------------- helpers */

const allCells = (): number[] => Array.from({ length: CELL_COUNT }, (_, index) => index);
const range1to9 = (): number[] => [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** The row or column shared by every given cell, if any. */
function sharedLine(cells: readonly number[]): Unit | null {
  if (cells.every((cell) => rowOf(cell) === rowOf(cells[0]))) return ROWS[rowOf(cells[0])];
  if (cells.every((cell) => colOf(cell) === colOf(cells[0]))) return COLUMNS[colOf(cells[0])];
  return null;
}

export function* combinations<T>(items: readonly T[], size: number): Generator<T[]> {
  const indices: number[] = [];
  const walk = function* (start: number): Generator<T[]> {
    if (indices.length === size) {
      yield indices.map((index) => items[index]);
      return;
    }
    for (let index = start; index < items.length; index += 1) {
      indices.push(index);
      yield* walk(index + 1);
      indices.pop();
    }
  };
  if (size <= items.length) yield* walk(0);
}
