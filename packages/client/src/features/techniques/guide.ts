import { indexOf, type TechniqueId } from '@zudoku/shared';

export type TechniqueLevel = 'basic' | 'intermediate' | 'advanced';

/**
 * How a diagram is read.
 * - `notes` draws the full candidate list of every empty cell in the crop. That
 *   is only legible over a small region — which is exactly where these
 *   techniques live, so the crop is kept to one box or so.
 * - `scan` follows a single digit across a wide region: every cell says only
 *   whether that digit still fits. It is how a solver actually hunts for an
 *   X-Wing, and it stays readable at nine columns on a phone.
 */
export type GuideMode = 'notes' | 'scan';

/** The window of the board a diagram shows, in 0-based coordinates. */
export interface GuideView {
  row: number;
  col: number;
  rows: number;
  cols: number;
}

export interface GuideExample {
  /** Crop shown. Cropping is what makes the cells big enough to read. */
  view: GuideView;
  mode: GuideMode;
  /** The digit (or digits) the technique is about; lit wherever they appear. */
  focus?: number[];
  /** Digits already placed, by cell index. */
  digits?: Record<number, number>;
  /** Candidate marks, by cell index (`notes` mode). */
  notes?: Record<number, number[]>;
  /** Cells where the focus digit still fits (`scan` mode). */
  marks?: number[];
  /** Cells where the focus digit has just been ruled out (`scan` mode). */
  ruled?: number[];
  /** Candidates the technique removes, drawn struck through (`notes` mode). */
  cuts?: Record<number, number[]>;
  /** Cells forming the pattern. */
  pattern?: number[];
  /** Cells the technique acts on. */
  targets?: number[];
  /** Placed digits that do the ruling out, ringed rather than filled. */
  cause?: number[];
  /** Rows and columns the argument runs along, washed faintly. */
  bands?: { rows?: number[]; cols?: number[] };
}

/** Structure only: titles, summaries, steps and captions come from the dictionaries. */
export interface GuideEntry {
  id: TechniqueId;
  level: TechniqueLevel;
  example: GuideExample;
}

const at = indexOf;

/** A whole 3x3 box, by its row band and column stack. */
const box = (band: number, stack: number): GuideView => ({
  row: band * 3,
  col: stack * 3,
  rows: 3,
  cols: 3,
});

/** Three full rows: enough to hold a box and the lines that cross it. */
const rowBand = (band: number): GuideView => ({ row: band * 3, col: 0, rows: 3, cols: 9 });

const WHOLE_BOARD: GuideView = { row: 0, col: 0, rows: 9, cols: 9 };

export const TECHNIQUE_GUIDE: readonly GuideEntry[] = [
  {
    id: 'naked_single',
    level: 'basic',
    // Box 5 alone: five digits placed, and one of the four gaps has a single
    // candidate left. The whole argument fits in nine cells.
    example: {
      view: box(1, 1),
      mode: 'notes',
      focus: [7],
      digits: {
        [at(3, 3)]: 1,
        [at(3, 4)]: 8,
        [at(3, 5)]: 5,
        [at(4, 3)]: 6,
        [at(5, 3)]: 2,
      },
      notes: {
        [at(4, 4)]: [7],
        [at(4, 5)]: [3, 4],
        [at(5, 4)]: [3, 4, 9],
        [at(5, 5)]: [4, 9],
      },
      pattern: [at(4, 4)],
    },
  },
  {
    id: 'hidden_single',
    level: 'basic',
    // The 7 in box 1 kills R1C2; the 7 in box 3 kills both gaps on the right.
    // One gap in row 1 survives, and it is not even the emptiest cell.
    example: {
      view: rowBand(0),
      mode: 'scan',
      focus: [7],
      digits: {
        [at(0, 0)]: 4,
        [at(0, 2)]: 5,
        [at(0, 3)]: 1,
        [at(0, 5)]: 9,
        [at(0, 6)]: 3,
        [at(1, 6)]: 7,
        [at(2, 0)]: 7,
      },
      marks: [at(0, 4)],
      ruled: [at(0, 1), at(0, 7), at(0, 8)],
      cause: [at(1, 6), at(2, 0)],
      pattern: [at(0, 4)],
      targets: [at(0, 1), at(0, 7), at(0, 8)],
      bands: { rows: [0] },
    },
  },
  {
    id: 'naked_pair',
    level: 'intermediate',
    // The pair sits in box 1, so the unit and its three victims share one crop.
    example: {
      view: box(0, 0),
      mode: 'notes',
      focus: [4, 5],
      digits: {
        [at(1, 2)]: 3,
        [at(2, 0)]: 1,
        [at(2, 1)]: 7,
        [at(2, 2)]: 2,
      },
      notes: {
        [at(0, 0)]: [4, 5],
        [at(0, 1)]: [4, 5],
        [at(0, 2)]: [4, 5, 6],
        [at(1, 0)]: [4, 5, 9],
        [at(1, 1)]: [5, 8],
      },
      cuts: {
        [at(0, 2)]: [4, 5],
        [at(1, 0)]: [4, 5],
        [at(1, 1)]: [5],
      },
      pattern: [at(0, 0), at(0, 1)],
      targets: [at(0, 2), at(1, 0), at(1, 1)],
    },
  },
  {
    id: 'hidden_pair',
    level: 'intermediate',
    // 1 and 2 hide inside two crowded cells of box 7. The clearing happens
    // inside the pattern itself, which is what makes this one hard to spot.
    example: {
      view: box(2, 0),
      mode: 'notes',
      focus: [1, 2],
      digits: {
        [at(7, 1)]: 3,
        [at(8, 0)]: 4,
        [at(8, 1)]: 5,
        [at(8, 2)]: 9,
      },
      notes: {
        [at(6, 0)]: [1, 2, 6, 7],
        [at(6, 1)]: [1, 2, 8],
        [at(6, 2)]: [6, 7, 8],
        [at(7, 0)]: [6, 7, 8],
        [at(7, 2)]: [6, 7],
      },
      cuts: {
        [at(6, 0)]: [6, 7],
        [at(6, 1)]: [8],
      },
      pattern: [at(6, 0), at(6, 1)],
    },
  },
  {
    id: 'pointing_pair',
    level: 'intermediate',
    // Box 1 is full except for its top row, so its 7 has to sit on row 1.
    example: {
      view: rowBand(0),
      mode: 'scan',
      focus: [7],
      digits: {
        [at(0, 2)]: 5,
        [at(0, 3)]: 1,
        [at(0, 4)]: 9,
        [at(0, 6)]: 3,
        [at(0, 7)]: 6,
        [at(1, 0)]: 1,
        [at(1, 1)]: 3,
        [at(1, 2)]: 4,
        [at(2, 0)]: 6,
        [at(2, 1)]: 8,
        [at(2, 2)]: 9,
      },
      marks: [at(0, 0), at(0, 1)],
      ruled: [at(0, 5), at(0, 8)],
      pattern: [at(0, 0), at(0, 1)],
      targets: [at(0, 5), at(0, 8)],
      bands: { rows: [0] },
    },
  },
  {
    id: 'box_line_reduction',
    level: 'intermediate',
    // The mirror image: row 1 is full outside box 1, so its 4 has to land there.
    example: {
      view: rowBand(0),
      mode: 'scan',
      focus: [4],
      digits: {
        [at(0, 3)]: 1,
        [at(0, 4)]: 5,
        [at(0, 5)]: 9,
        [at(0, 6)]: 6,
        [at(0, 7)]: 3,
        [at(0, 8)]: 8,
      },
      marks: [at(0, 0), at(0, 1), at(0, 2)],
      ruled: [at(1, 0), at(1, 1), at(1, 2), at(2, 0), at(2, 1), at(2, 2)],
      pattern: [at(0, 0), at(0, 1), at(0, 2)],
      targets: [at(1, 0), at(1, 1), at(1, 2), at(2, 0), at(2, 1), at(2, 2)],
      bands: { rows: [0] },
    },
  },
  {
    id: 'naked_triple',
    level: 'intermediate',
    // Three cells sharing three digits between them, inside box 3.
    example: {
      view: box(0, 2),
      mode: 'notes',
      focus: [2, 6, 9],
      digits: {
        [at(0, 8)]: 1,
        [at(1, 8)]: 5,
        [at(2, 6)]: 8,
        [at(2, 7)]: 3,
      },
      notes: {
        [at(0, 6)]: [2, 6],
        [at(0, 7)]: [6, 9],
        [at(1, 6)]: [2, 9],
        [at(1, 7)]: [2, 4, 6, 9],
        [at(2, 8)]: [6, 7, 9],
      },
      cuts: {
        [at(1, 7)]: [2, 6, 9],
        [at(2, 8)]: [6, 9],
      },
      pattern: [at(0, 6), at(0, 7), at(1, 6)],
      targets: [at(1, 7), at(2, 8)],
    },
  },
  {
    id: 'x_wing',
    level: 'advanced',
    // The whole board read one digit at a time: four corners and the two
    // columns they own.
    example: {
      view: WHOLE_BOARD,
      mode: 'scan',
      focus: [4],
      marks: [at(1, 2), at(1, 6), at(6, 2), at(6, 6)],
      ruled: [at(3, 2), at(7, 2), at(4, 6), at(8, 6)],
      pattern: [at(1, 2), at(1, 6), at(6, 2), at(6, 6)],
      targets: [at(3, 2), at(7, 2), at(4, 6), at(8, 6)],
      bands: { rows: [1, 6], cols: [2, 6] },
    },
  },
  {
    id: 'xy_wing',
    level: 'advanced',
    // Pivot and pincers sit at three corners of a 5x5 window, so their
    // two-candidate lists stay readable and the sight-lines stay visible.
    example: {
      view: { row: 1, col: 1, rows: 5, cols: 5 },
      mode: 'notes',
      focus: [3],
      notes: {
        [at(1, 1)]: [1, 2],
        [at(1, 5)]: [1, 3],
        [at(5, 1)]: [2, 3],
        [at(5, 5)]: [3, 9],
      },
      cuts: { [at(5, 5)]: [3] },
      pattern: [at(1, 1), at(1, 5), at(5, 1)],
      targets: [at(5, 5)],
      bands: { rows: [1, 5], cols: [1, 5] },
    },
  },
  {
    id: 'swordfish',
    level: 'advanced',
    // Three rows, three columns: the X-Wing argument one size up.
    example: {
      view: WHOLE_BOARD,
      mode: 'scan',
      focus: [5],
      marks: [at(0, 0), at(0, 1), at(3, 1), at(3, 2), at(6, 0), at(6, 2)],
      ruled: [at(2, 0), at(5, 2), at(8, 1)],
      pattern: [at(0, 0), at(0, 1), at(3, 1), at(3, 2), at(6, 0), at(6, 2)],
      targets: [at(2, 0), at(5, 2), at(8, 1)],
      bands: { rows: [0, 3, 6], cols: [0, 1, 2] },
    },
  },
];

export const TECHNIQUE_LEVELS: readonly TechniqueLevel[] = ['basic', 'intermediate', 'advanced'];
