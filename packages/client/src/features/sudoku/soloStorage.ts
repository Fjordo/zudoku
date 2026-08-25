import type { Difficulty } from '@zudoku/shared';
import { readJson, remove, writeJson } from '../../lib/storage';
import type { GameState } from './gameState';

/** v2 dropped the saves that could still hold a wrong digit on the grid. */
const SAVE_KEY = 'zudoku.solo.v2';

export interface SavedSoloGame {
  version: 2;
  difficulty: Difficulty;
  state: GameState;
  elapsedMs: number;
  savedAt: number;
}

export function loadSoloGame(difficulty: Difficulty): SavedSoloGame | null {
  const saved = readJson<SavedSoloGame>(SAVE_KEY);
  if (!saved || saved.version !== 2 || saved.difficulty !== difficulty) return null;
  if (saved.state?.status !== 'playing') return null;
  // A flash belongs to the moment it was played, never to a restored game.
  return { ...saved, state: { ...saved.state, flash: null } };
}

export const saveSoloGame = (save: SavedSoloGame): void => writeJson(SAVE_KEY, save);

export const clearSoloGame = (): void => remove(SAVE_KEY);
