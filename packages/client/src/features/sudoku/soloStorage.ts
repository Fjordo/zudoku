import { DIFFICULTIES, type Difficulty } from '@zudoku/shared';
import { readJson, remove, writeJson } from '../../lib/storage';
import type { GameState } from './gameState';

/** v2 dropped the saves that could still hold a wrong digit on the grid. */
const SAVE_PREFIX = 'zudoku.solo.v2';

/**
 * One slot per difficulty: starting an easy game must not throw away the hard
 * one left half solved.
 */
const slotKey = (difficulty: Difficulty): string => `${SAVE_PREFIX}.${difficulty}`;

/** The single slot every difficulty used to share, still read so no game in progress is lost. */
const LEGACY_KEY = SAVE_PREFIX;

export interface SavedSoloGame {
  version: 2;
  difficulty: Difficulty;
  state: GameState;
  elapsedMs: number;
  savedAt: number;
}

function readSlot(key: string, difficulty: Difficulty): SavedSoloGame | null {
  const saved = readJson<SavedSoloGame>(key);
  if (!saved || saved.version !== 2 || saved.difficulty !== difficulty) return null;
  if (saved.state?.status !== 'playing') return null;
  // A flash belongs to the moment it was played, never to a restored game.
  return { ...saved, state: { ...saved.state, flash: null } };
}

export const loadSoloGame = (difficulty: Difficulty): SavedSoloGame | null =>
  readSlot(slotKey(difficulty), difficulty) ?? readSlot(LEGACY_KEY, difficulty);

export const saveSoloGame = (save: SavedSoloGame): void => writeJson(slotKey(save.difficulty), save);

export function clearSoloGame(difficulty: Difficulty): void {
  remove(slotKey(difficulty));
  if (readJson<SavedSoloGame>(LEGACY_KEY)?.difficulty === difficulty) remove(LEGACY_KEY);
}

/** Difficulty of the game left in progress most recently, so the home screen offers it first. */
export function latestSavedDifficulty(): Difficulty | null {
  let latest: SavedSoloGame | null = null;
  for (const difficulty of DIFFICULTIES) {
    const saved = loadSoloGame(difficulty);
    if (saved && (!latest || saved.savedAt > latest.savedAt)) latest = saved;
  }
  return latest?.difficulty ?? null;
}
