import {
  CELL_COUNT,
  EMPTY_CELL,
  MAX_MISTAKES,
  PEERS,
  colOf,
  findNextStep,
  gridToString,
  parseGrid,
  rowOf,
  type Step,
} from '@zudoku/shared';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  puzzle: string;
  solution: string;
  /** Cells that came with the puzzle and cannot be edited. */
  givens: boolean[];
  /** Cells revealed by a hint; locked like givens but marked differently. */
  hinted: boolean[];
  cells: number[];
  /** Pencil marks, one 9-bit mask per cell. */
  notes: number[];
  selected: number | null;
  /** Digit driving the highlight, set by the number pad or by selecting a cell. */
  activeDigit: number | null;
  notesMode: boolean;
  mistakes: number;
  hintsLeft: number;
  status: GameStatus;
  history: HistoryEntry[];
  /** Explanation of the last hint, shown until the player moves again. */
  hint: HintInfo | null;
}

/**
 * Hints are stored structurally, not as text, so the UI can render them in the
 * player's language and re-render on a language change.
 */
export type HintInfo =
  | { kind: 'step'; step: Step }
  | { kind: 'wrong'; index: number; digit: number }
  | { kind: 'none' };

/** Cells the hint refers to, highlighted on the board. */
export const hintCells = (hint: HintInfo | null): number[] => {
  if (!hint) return [];
  if (hint.kind === 'step') return hint.step.cells;
  return hint.kind === 'wrong' ? [hint.index] : [];
};

interface HistoryEntry {
  cells: number[];
  notes: number[];
  mistakes: number;
}

export type GameAction =
  | { type: 'select'; index: number | null }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'toggle_notes' }
  | { type: 'hint' }
  | { type: 'dismiss_hint' }
  | { type: 'undo' }
  | { type: 'highlight'; digit: number | null }
  | { type: 'give_up' };

export interface GameSetup {
  puzzle: string;
  solution: string;
  hints: number;
}

const MAX_HISTORY = 100;
const noteBit = (digit: number): number => 1 << (digit - 1);
export const hasNote = (mask: number, digit: number): boolean => (mask & noteBit(digit)) !== 0;

export function createGame({ puzzle, solution, hints }: GameSetup): GameState {
  const cells = parseGrid(puzzle);
  return {
    puzzle,
    solution,
    givens: cells.map((value) => value !== EMPTY_CELL),
    hinted: new Array<boolean>(CELL_COUNT).fill(false),
    cells,
    notes: new Array<number>(CELL_COUNT).fill(0),
    selected: null,
    activeDigit: null,
    notesMode: false,
    mistakes: 0,
    hintsLeft: hints,
    status: 'playing',
    history: [],
    hint: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select': {
      const index = action.index;
      if (index === null) return { ...state, selected: null };
      return {
        ...state,
        selected: index,
        activeDigit: state.cells[index] !== EMPTY_CELL ? state.cells[index] : state.activeDigit,
      };
    }
    case 'highlight':
      return { ...state, activeDigit: action.digit };
    case 'toggle_notes':
      return { ...state, notesMode: !state.notesMode };
    case 'input':
      return applyInput(state, action.digit);
    case 'erase':
      return applyErase(state);
    case 'hint':
      return applyHint(state);
    case 'undo':
      return applyUndo(state);
    case 'dismiss_hint':
      return state.hint === null ? state : { ...state, hint: null };
    case 'give_up':
      return state.status === 'playing' ? { ...state, status: 'lost' } : state;
    default:
      return state;
  }
}

function applyInput(state: GameState, digit: number): GameState {
  const index = state.selected;
  const next = { ...state, activeDigit: digit };
  if (state.status !== 'playing' || index === null || isLocked(state, index)) return next;

  if (state.notesMode) {
    if (state.cells[index] !== EMPTY_CELL) return next;
    const notes = [...state.notes];
    notes[index] ^= noteBit(digit);
    return { ...next, notes, hint: null, history: pushHistory(state) };
  }

  if (state.cells[index] === digit) return next;

  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[index] = digit;
  notes[index] = 0;

  const correct = digit === solutionAt(state, index);
  if (correct) {
    // A confirmed digit invalidates the same pencil mark in every peer cell.
    for (const peer of PEERS[index]) notes[peer] &= ~noteBit(digit);
  }

  const mistakes = correct ? state.mistakes : state.mistakes + 1;
  const status = resolveStatus(cells, state.solution, mistakes);

  return {
    ...next,
    cells,
    notes,
    mistakes,
    status,
    hint: null,
    history: pushHistory(state),
  };
}

function applyErase(state: GameState): GameState {
  const index = state.selected;
  if (state.status !== 'playing' || index === null || isLocked(state, index)) return state;
  if (state.cells[index] === EMPTY_CELL && state.notes[index] === 0) return state;

  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[index] = EMPTY_CELL;
  notes[index] = 0;
  return { ...state, cells, notes, hint: null, history: pushHistory(state) };
}

/**
 * Hints teach rather than just reveal: they replay the next logical step found
 * by the shared solver, describing the technique that justifies it.
 */
function applyHint(state: GameState): GameState {
  if (state.status !== 'playing' || state.hintsLeft <= 0) return state;

  const wrongIndex = state.cells.findIndex((_, index) => isWrong(state, index));
  if (wrongIndex !== -1) {
    return {
      ...state,
      selected: wrongIndex,
      hintsLeft: state.hintsLeft - 1,
      hint: { kind: 'wrong', index: wrongIndex, digit: state.cells[wrongIndex] },
    };
  }

  const step = findNextStep(state.cells);
  if (!step) return { ...state, hint: { kind: 'none' } };

  const notes = [...state.notes];
  for (const { index, digit } of step.eliminations) notes[index] &= ~noteBit(digit);

  const placement = step.placements[0];
  if (!placement) {
    // Nothing to place yet: the step only removes candidates, so clean the notes.
    return {
      ...state,
      notes,
      hintsLeft: state.hintsLeft - 1,
      hint: { kind: 'step', step },
      history: pushHistory(state),
    };
  }

  const cells = [...state.cells];
  const hinted = [...state.hinted];
  cells[placement.index] = placement.digit;
  notes[placement.index] = 0;
  hinted[placement.index] = true;
  for (const peer of PEERS[placement.index]) notes[peer] &= ~noteBit(placement.digit);

  return {
    ...state,
    cells,
    notes,
    hinted,
    selected: placement.index,
    activeDigit: placement.digit,
    hintsLeft: state.hintsLeft - 1,
    status: resolveStatus(cells, state.solution, state.mistakes),
    hint: { kind: 'step', step },
    history: pushHistory(state),
  };
}

function applyUndo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous || state.status !== 'playing') return state;
  return {
    ...state,
    cells: previous.cells,
    notes: previous.notes,
    mistakes: previous.mistakes,
    history: state.history.slice(0, -1),
  };
}

const isLocked = (state: GameState, index: number): boolean => state.givens[index] || state.hinted[index];

const solutionAt = (state: GameState, index: number): number => Number(state.solution[index]);

function resolveStatus(cells: number[], solution: string, mistakes: number): GameStatus {
  if (mistakes >= MAX_MISTAKES) return 'lost';
  return gridToString(cells) === solution ? 'won' : 'playing';
}

function pushHistory(state: GameState): HistoryEntry[] {
  const entry: HistoryEntry = { cells: state.cells, notes: state.notes, mistakes: state.mistakes };
  return [...state.history, entry].slice(-MAX_HISTORY);
}

/* --- selectors --- */

export const isWrong = (state: GameState, index: number): boolean =>
  state.cells[index] !== EMPTY_CELL && state.cells[index] !== solutionAt(state, index);

export const filledCount = (state: GameState): number =>
  state.cells.reduce((total, value) => total + (value === EMPTY_CELL ? 0 : 1), 0);

export const remainingForDigit = (state: GameState, digit: number): number =>
  9 - state.cells.filter((value) => value === digit).length;

export interface Highlight {
  /** Cells holding the active digit. */
  matches: Set<number>;
  /** Cells on a row or column that contains the active digit. */
  lines: Set<number>;
  /** Row, column and box of the selected cell. */
  related: Set<number>;
}

/**
 * Highlight model: picking a digit lights every cell holding it plus the rows
 * and columns those cells sit in; selecting a cell lights its own units.
 */
export function computeHighlight(state: GameState): Highlight {
  const matches = new Set<number>();
  const lines = new Set<number>();
  const related = new Set<number>();

  if (state.activeDigit !== null) {
    const rows = new Set<number>();
    const cols = new Set<number>();
    state.cells.forEach((value, index) => {
      if (value !== state.activeDigit) return;
      matches.add(index);
      rows.add(rowOf(index));
      cols.add(colOf(index));
    });
    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (rows.has(rowOf(index)) || cols.has(colOf(index))) lines.add(index);
    }
  }

  if (state.selected !== null) {
    related.add(state.selected);
    for (const peer of PEERS[state.selected]) related.add(peer);
  }

  return { matches, lines, related };
}
