import type { TechniqueId } from './techniques.js';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface DifficultyProfile {
  label: string;
  /** Clues aimed for while carving the puzzle; fewer clues means harder. */
  targetClues: number;
  /** Hints a player may consume during a game. */
  hints: number;
  /** Techniques a solver is allowed to use on this difficulty. */
  allowed: readonly TechniqueId[];
  /**
   * Techniques the puzzle must actually require: it has to resist the previous
   * band, otherwise it would be easier than advertised.
   */
  resists: readonly TechniqueId[];
  /**
   * Steps from `HARD_TECHNIQUES` the solve has to need. One lucky wing makes a
   * hard puzzle; needing them repeatedly is what makes an expert one.
   */
  minHardSteps: number;
  /** Candidate puzzles to try before settling for the closest match. */
  attempts: number;
}

const SINGLES: readonly TechniqueId[] = ['naked_single', 'hidden_single'];

const INTERMEDIATE: readonly TechniqueId[] = [
  ...SINGLES,
  'naked_pair',
  'hidden_pair',
  'pointing_pair',
  'box_line_reduction',
  'naked_triple',
];

/** The tools that separate an expert grid from a merely hard one. */
export const HARD_TECHNIQUES: readonly TechniqueId[] = ['x_wing', 'xy_wing', 'swordfish'];

const ADVANCED: readonly TechniqueId[] = [...INTERMEDIATE, ...HARD_TECHNIQUES];

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: { label: 'Easy', targetClues: 42, hints: 5, allowed: SINGLES, resists: [], minHardSteps: 0, attempts: 40 },
  medium: {
    label: 'Medium',
    targetClues: 30,
    hints: 3,
    allowed: INTERMEDIATE,
    resists: SINGLES,
    minHardSteps: 0,
    attempts: 40,
  },
  hard: {
    label: 'Hard',
    targetClues: 26,
    hints: 2,
    allowed: ADVANCED,
    resists: INTERMEDIATE,
    minHardSteps: 1,
    attempts: 40,
  },
  // Fewer clues, a single hint, and a grid that keeps asking for the hard tools.
  expert: {
    label: 'Expert',
    targetClues: 23,
    hints: 1,
    allowed: ADVANCED,
    resists: INTERMEDIATE,
    minHardSteps: 2,
    attempts: 120,
  },
};

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);

/** Wrong entries allowed before the game is lost. */
export const MAX_MISTAKES = 3;
