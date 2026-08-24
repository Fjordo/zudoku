/** Candidate bookkeeping shared by every human-style solving technique. */
import { BOX_SIZE, CELL_COUNT, EMPTY_CELL, PEERS, SIZE, boxOf, colOf, indexOf, rowOf, type ReadonlyGrid } from './grid.js';

/** One 9-bit mask per cell; filled cells have a mask of 0. */
export type Candidates = number[];

export const ALL_DIGITS_MASK = 0b111111111;
export const bitOf = (digit: number): number => 1 << (digit - 1);
export const hasCandidate = (mask: number, digit: number): boolean => (mask & bitOf(digit)) !== 0;

export function digitsOf(mask: number): number[] {
  const digits: number[] = [];
  for (let digit = 1; digit <= SIZE; digit += 1) {
    if (hasCandidate(mask, digit)) digits.push(digit);
  }
  return digits;
}

export function countBits(mask: number): number {
  let bits = mask;
  let count = 0;
  while (bits) {
    bits &= bits - 1;
    count += 1;
  }
  return count;
}

export type UnitKind = 'row' | 'column' | 'box';

export interface Unit {
  kind: UnitKind;
  /** 0-based position of the unit within its kind. */
  position: number;
  cells: readonly number[];
}

export function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function buildUnits(): readonly Unit[] {
  const units: Unit[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    units.push({ kind: 'row', position: row, cells: range(SIZE).map((col) => indexOf(row, col)) });
  }
  for (let col = 0; col < SIZE; col += 1) {
    units.push({ kind: 'column', position: col, cells: range(SIZE).map((row) => indexOf(row, col)) });
  }
  for (let box = 0; box < SIZE; box += 1) {
    const startRow = Math.floor(box / BOX_SIZE) * BOX_SIZE;
    const startCol = (box % BOX_SIZE) * BOX_SIZE;
    const cells: number[] = [];
    for (let row = startRow; row < startRow + BOX_SIZE; row += 1) {
      for (let col = startCol; col < startCol + BOX_SIZE; col += 1) cells.push(indexOf(row, col));
    }
    units.push({ kind: 'box', position: box, cells });
  }
  return units;
}

/** The 27 units of a Sudoku grid: 9 rows, 9 columns, 9 boxes. */
export const UNITS = buildUnits();
export const ROWS = UNITS.filter((unit) => unit.kind === 'row');
export const COLUMNS = UNITS.filter((unit) => unit.kind === 'column');
export const BOXES = UNITS.filter((unit) => unit.kind === 'box');

export const unitOf = (kind: UnitKind, index: number): Unit =>
  kind === 'row' ? ROWS[rowOf(index)] : kind === 'column' ? COLUMNS[colOf(index)] : BOXES[boxOf(index)];

/** Candidates for every empty cell, derived from the values already placed. */
export function computeCandidates(grid: ReadonlyGrid): Candidates {
  const candidates: Candidates = new Array<number>(CELL_COUNT).fill(ALL_DIGITS_MASK);
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = grid[index];
    if (value === EMPTY_CELL) continue;
    candidates[index] = 0;
    for (const peer of PEERS[index]) candidates[peer] &= ~bitOf(value);
  }
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] !== EMPTY_CELL) candidates[index] = 0;
  }
  return candidates;
}

/** Cells of `unit` that still accept `digit`. */
export const cellsWithCandidate = (unit: Unit, candidates: Candidates, digit: number): number[] =>
  unit.cells.filter((cell) => hasCandidate(candidates[cell], digit));

/** Human-readable cell name, e.g. R4C7. */
export const cellName = (index: number): string => `R${rowOf(index) + 1}C${colOf(index) + 1}`;

export const cellNames = (indices: readonly number[]): string => indices.map(cellName).join(', ');

export const unitName = (unit: Unit): string =>
  `${unit.kind === 'row' ? 'row' : unit.kind === 'column' ? 'column' : 'box'} ${unit.position + 1}`;
