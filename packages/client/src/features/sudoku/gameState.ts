import {
  CELL_COUNT,
  EMPTY_CELL,
  MAX_MISTAKES,
  PEERS,
  SIZE,
  colOf,
  findNextStep,
  gridToString,
  indexOf,
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
  /** Last digit the board is still animating; cleared on a timer. */
  flash: Flash | null;
}

/**
 * The two answers the board can give to an entry: a correct digit seats for
 * good, a wrong one is shaken off and never lands.
 */
export interface Flash {
  index: number;
  digit: number;
  kind: 'locked' | 'rejected';
  /** Restarts the animation when the same cell flashes twice in a row. */
  id: number;
}

/** How long the board plays each flash before the reducer drops it. */
export const FLASH_MS: Record<Flash['kind'], number> = { locked: 460, rejected: 580 };

/**
 * Hints are stored structurally, not as text, so the UI can render them in the
 * player's language and re-render on a language change.
 */
export type HintInfo = { kind: 'step'; step: Step } | { kind: 'none' };

/** Cells the hint refers to, highlighted on the board. */
export const hintCells = (hint: HintInfo | null): number[] =>
  hint?.kind === 'step' ? hint.step.cells : [];

/** Only pencil marks are reversible, so that is all a history entry holds. */
interface HistoryEntry {
  notes: number[];
}

export type GameAction =
  | { type: 'select'; index: number | null }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'toggle_notes' }
  | { type: 'hint' }
  | { type: 'dismiss_hint' }
  | { type: 'undo' }
  | { type: 'clear_flash'; id: number }
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
    flash: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select': {
      const index = action.index;
      if (index === null) return { ...state, selected: null };
      // A filled cell puts its digit in play; an empty one only reads its own
      // row and column, so no digit stays lit across the rest of the grid.
      return {
        ...state,
        selected: index,
        activeDigit: state.cells[index] !== EMPTY_CELL ? state.cells[index] : null,
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
    case 'clear_flash':
      return state.flash?.id === action.id ? { ...state, flash: null } : state;
    case 'give_up':
      return state.status === 'playing' ? { ...state, status: 'lost' } : state;
    default:
      return state;
  }
}

function applyInput(state: GameState, digit: number): GameState {
  const index = state.selected;
  // A digit placed nine times is spent: it leaves the keypad, and the keyboard
  // shortcut for it goes quiet too, so it can never cost a life by accident.
  if (remainingForDigit(state, digit) <= 0) return state;

  const next = { ...state, activeDigit: digit };
  if (state.status !== 'playing' || index === null || isLocked(state, index)) return next;

  if (state.notesMode) {
    const notes = [...state.notes];
    notes[index] ^= noteBit(digit);
    return { ...next, notes, hint: null, history: pushHistory(state) };
  }

  const flash = (kind: Flash['kind']): Flash => ({ index, digit, kind, id: nextFlashId(state) });

  if (digit !== solutionAt(state, index)) {
    // A wrong digit costs a life and bounces off: only truth stays on the grid.
    const mistakes = state.mistakes + 1;
    return {
      ...next,
      mistakes,
      status: resolveStatus(state.cells, state.solution, mistakes),
      hint: null,
      flash: flash('rejected'),
    };
  }

  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[index] = digit;
  notes[index] = 0;
  // A confirmed digit invalidates the same pencil mark in every peer cell.
  for (const peer of PEERS[index]) notes[peer] &= ~noteBit(digit);

  return {
    ...next,
    cells,
    notes,
    status: resolveStatus(cells, state.solution, state.mistakes),
    hint: null,
    flash: flash('locked'),
  };
}

/** Placed digits are final, so erasing only ever clears pencil marks. */
function applyErase(state: GameState): GameState {
  const index = state.selected;
  if (state.status !== 'playing' || index === null || isLocked(state, index)) return state;
  if (state.notes[index] === 0) return state;

  const notes = [...state.notes];
  notes[index] = 0;
  return { ...state, notes, hint: null, history: pushHistory(state) };
}

/**
 * Hints teach rather than just reveal: they replay the next logical step found
 * by the shared solver, describing the technique that justifies it.
 */
function applyHint(state: GameState): GameState {
  if (state.status !== 'playing' || state.hintsLeft <= 0) return state;

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
    flash: { index: placement.index, digit: placement.digit, kind: 'locked', id: nextFlashId(state) },
  };
}

/**
 * Undo walks back pencil marks, nothing else: a placed digit is permanent and
 * a life, once spent, stays spent.
 */
function applyUndo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous || state.status !== 'playing') return state;
  return { ...state, notes: previous.notes, history: state.history.slice(0, -1) };
}

/** Every digit that lands on the board is correct, so a filled cell is final. */
const isLocked = (state: GameState, index: number): boolean => state.cells[index] !== EMPTY_CELL;

const solutionAt = (state: GameState, index: number): number => Number(state.solution[index]);

const nextFlashId = (state: GameState): number => (state.flash?.id ?? 0) + 1;

function resolveStatus(cells: number[], solution: string, mistakes: number): GameStatus {
  if (mistakes >= MAX_MISTAKES) return 'lost';
  return gridToString(cells) === solution ? 'won' : 'playing';
}

function pushHistory(state: GameState): HistoryEntry[] {
  return [...state.history, { notes: state.notes }].slice(-MAX_HISTORY);
}

/* --- selectors --- */

export const filledCount = (state: GameState): number =>
  state.cells.reduce((total, value) => total + (value === EMPTY_CELL ? 0 : 1), 0);

export const remainingForDigit = (state: GameState, digit: number): number =>
  9 - state.cells.filter((value) => value === digit).length;

export interface Highlight {
  /** Cells holding the active digit. */
  matches: Set<number>;
  /** Row and column of the selected cell. */
  related: Set<number>;
  /** Digits the selected cell can already see on that row and column. */
  placed: Set<number>;
}

/**
 * Highlight model, deliberately stingy: a digit lights only the cells that hold
 * it, and a selected cell lights its own row and column, marking the digits
 * already standing there. Nothing on the board points at what is missing.
 */
export function computeHighlight(state: GameState): Highlight {
  const matches = new Set<number>();
  const related = new Set<number>();
  const placed = new Set<number>();

  if (state.activeDigit !== null) {
    state.cells.forEach((value, index) => {
      if (value === state.activeDigit) matches.add(index);
    });
  }

  if (state.selected !== null) {
    const row = rowOf(state.selected);
    const col = colOf(state.selected);
    for (let offset = 0; offset < SIZE; offset += 1) {
      related.add(indexOf(row, offset));
      related.add(indexOf(offset, col));
    }
    related.delete(state.selected);
    for (const index of related) {
      if (state.cells[index] !== EMPTY_CELL) placed.add(index);
    }
  }

  return { matches, related, placed };
}
