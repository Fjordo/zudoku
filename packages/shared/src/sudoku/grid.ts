/** Core grid primitives: a Sudoku grid is a flat array of 81 cells, 0 meaning empty. */

export const SIZE = 9;
export const BOX_SIZE = 3;
export const CELL_COUNT = SIZE * SIZE;
export const DIGITS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const EMPTY_CELL = 0;

/** A grid holds `CELL_COUNT` cells with values 0..9. */
export type Grid = number[];
export type ReadonlyGrid = readonly number[];

export const rowOf = (index: number): number => Math.floor(index / SIZE);
export const colOf = (index: number): number => index % SIZE;
export const boxOf = (index: number): number =>
  Math.floor(rowOf(index) / BOX_SIZE) * BOX_SIZE + Math.floor(colOf(index) / BOX_SIZE);
export const indexOf = (row: number, col: number): number => row * SIZE + col;

function buildPeers(): readonly (readonly number[])[] {
  const peers: number[][] = [];
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const set = new Set<number>();
    for (let other = 0; other < CELL_COUNT; other += 1) {
      if (other === index) continue;
      if (rowOf(other) === rowOf(index) || colOf(other) === colOf(index) || boxOf(other) === boxOf(index)) {
        set.add(other);
      }
    }
    peers.push([...set]);
  }
  return peers;
}

/** Indices sharing a row, column or box with the given cell (excluding itself). */
export const PEERS = buildPeers();

export const createEmptyGrid = (): Grid => new Array<number>(CELL_COUNT).fill(EMPTY_CELL);

export const cloneGrid = (grid: ReadonlyGrid): Grid => [...grid];

/** True when `value` can be placed at `index` without breaking Sudoku constraints. */
export function isPlacementValid(grid: ReadonlyGrid, index: number, value: number): boolean {
  for (const peer of PEERS[index]) {
    if (grid[peer] === value) return false;
  }
  return true;
}

/** Cells that conflict with another cell holding the same value. */
export function findConflicts(grid: ReadonlyGrid): Set<number> {
  const conflicts = new Set<number>();
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = grid[index];
    if (value === EMPTY_CELL) continue;
    for (const peer of PEERS[index]) {
      if (grid[peer] === value) {
        conflicts.add(index);
        conflicts.add(peer);
      }
    }
  }
  return conflicts;
}

export const isComplete = (grid: ReadonlyGrid): boolean => grid.every((value) => value !== EMPTY_CELL);

/** A grid is solved when it is full and free of conflicts. */
export const isSolved = (grid: ReadonlyGrid): boolean => isComplete(grid) && findConflicts(grid).size === 0;

/** Serializes a grid to 81 characters, using '.' for empty cells. */
export const gridToString = (grid: ReadonlyGrid): string =>
  grid.map((value) => (value === EMPTY_CELL ? '.' : String(value))).join('');

/** Parses the 81-character representation produced by `gridToString`. */
export function parseGrid(source: string): Grid {
  const normalized = source.trim();
  if (normalized.length !== CELL_COUNT) {
    throw new Error(`Invalid grid: expected ${CELL_COUNT} characters, received ${normalized.length}`);
  }
  return [...normalized].map((char) => {
    if (char === '.' || char === '0') return EMPTY_CELL;
    const value = Number(char);
    if (!Number.isInteger(value) || value < 1 || value > SIZE) {
      throw new Error(`Invalid grid character: "${char}"`);
    }
    return value;
  });
}
