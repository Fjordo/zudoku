import { indexOf, type TechniqueId } from '@zudoku/shared';

export type TechniqueLevel = 'basic' | 'intermediate' | 'advanced';

export interface GuideExample {
  /** Digits already placed, by cell index. */
  digits?: Record<number, number>;
  /** Candidate marks, by cell index. */
  notes?: Record<number, number[]>;
  /** Cells forming the pattern. */
  pattern?: number[];
  /** Cells the technique acts on. */
  targets?: number[];
}

/** Structure only: titles, summaries, steps and captions come from the dictionaries. */
export interface GuideEntry {
  id: TechniqueId;
  level: TechniqueLevel;
  example: GuideExample;
}

const at = indexOf;

export const TECHNIQUE_GUIDE: readonly GuideEntry[] = [
  {
    id: 'naked_single',
    level: 'basic',
    example: {
      notes: { [at(4, 4)]: [7], [at(4, 5)]: [3, 4], [at(3, 4)]: [2, 3, 9] },
      pattern: [at(4, 4)],
    },
  },
  {
    id: 'hidden_single',
    level: 'basic',
    example: {
      notes: {
        [at(0, 0)]: [2, 3],
        [at(0, 1)]: [2, 3],
        [at(0, 2)]: [2, 3],
        [at(0, 4)]: [2, 3, 7],
        [at(0, 6)]: [2, 3],
        [at(0, 8)]: [2, 3],
      },
      pattern: [at(0, 4)],
    },
  },
  {
    id: 'naked_pair',
    level: 'intermediate',
    example: {
      notes: {
        [at(2, 0)]: [4, 5],
        [at(2, 1)]: [4, 5],
        [at(2, 3)]: [4, 5, 6],
        [at(2, 6)]: [5, 8],
      },
      pattern: [at(2, 0), at(2, 1)],
      targets: [at(2, 3), at(2, 6)],
    },
  },
  {
    id: 'hidden_pair',
    level: 'intermediate',
    example: {
      notes: {
        [at(5, 0)]: [1, 2, 6, 7],
        [at(5, 1)]: [1, 2, 8],
        [at(5, 4)]: [6, 7, 8],
        [at(5, 7)]: [6, 7],
      },
      pattern: [at(5, 0), at(5, 1)],
    },
  },
  {
    id: 'pointing_pair',
    level: 'intermediate',
    example: {
      notes: {
        [at(0, 0)]: [7, 1],
        [at(0, 1)]: [7, 2],
        [at(1, 0)]: [1, 2],
        [at(0, 5)]: [7, 3],
        [at(0, 8)]: [7, 4],
      },
      pattern: [at(0, 0), at(0, 1)],
      targets: [at(0, 5), at(0, 8)],
    },
  },
  {
    id: 'box_line_reduction',
    level: 'intermediate',
    example: {
      notes: {
        [at(0, 0)]: [7, 1],
        [at(0, 2)]: [7, 2],
        [at(1, 1)]: [7, 3],
        [at(2, 2)]: [7, 4],
      },
      pattern: [at(0, 0), at(0, 2)],
      targets: [at(1, 1), at(2, 2)],
    },
  },
  {
    id: 'naked_triple',
    level: 'intermediate',
    example: {
      notes: {
        [at(7, 0)]: [2, 6],
        [at(7, 1)]: [6, 9],
        [at(7, 2)]: [2, 9],
        [at(7, 5)]: [2, 6, 9, 4],
      },
      pattern: [at(7, 0), at(7, 1), at(7, 2)],
      targets: [at(7, 5)],
    },
  },
  {
    id: 'x_wing',
    level: 'advanced',
    example: {
      notes: {
        [at(1, 2)]: [4],
        [at(1, 6)]: [4],
        [at(6, 2)]: [4],
        [at(6, 6)]: [4],
        [at(3, 2)]: [4, 8],
        [at(8, 6)]: [4, 9],
      },
      pattern: [at(1, 2), at(1, 6), at(6, 2), at(6, 6)],
      targets: [at(3, 2), at(8, 6)],
    },
  },
  {
    id: 'xy_wing',
    level: 'advanced',
    example: {
      notes: {
        [at(1, 1)]: [1, 2],
        [at(1, 5)]: [1, 3],
        [at(5, 1)]: [2, 3],
        [at(5, 5)]: [3, 9],
      },
      pattern: [at(1, 1), at(1, 5), at(5, 1)],
      targets: [at(5, 5)],
    },
  },
  {
    id: 'swordfish',
    level: 'advanced',
    example: {
      notes: {
        [at(0, 0)]: [5],
        [at(0, 1)]: [5],
        [at(3, 1)]: [5],
        [at(3, 2)]: [5],
        [at(6, 0)]: [5],
        [at(6, 2)]: [5],
        [at(8, 1)]: [5, 8],
      },
      pattern: [at(0, 0), at(0, 1), at(3, 1), at(3, 2), at(6, 0), at(6, 2)],
      targets: [at(8, 1)],
    },
  },
];

export const TECHNIQUE_LEVELS: readonly TechniqueLevel[] = ['basic', 'intermediate', 'advanced'];
