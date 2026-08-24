import type { TechniqueId } from './techniques.js';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
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

const ADVANCED: readonly TechniqueId[] = [...INTERMEDIATE, 'x_wing', 'xy_wing', 'swordfish'];

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  easy: { label: 'Easy', targetClues: 42, hints: 5, allowed: SINGLES, resists: [] },
  medium: { label: 'Medium', targetClues: 30, hints: 3, allowed: INTERMEDIATE, resists: SINGLES },
  hard: { label: 'Hard', targetClues: 26, hints: 2, allowed: ADVANCED, resists: INTERMEDIATE },
};

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);

/** Wrong entries allowed before the game is lost. */
export const MAX_MISTAKES = 3;
