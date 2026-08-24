import type { Difficulty } from '@zudoku/shared';
import { readJson, remove, writeJson } from '../../lib/storage';
import type { GameState } from './gameState';

const SAVE_KEY = 'zudoku.solo.v1';

export interface SavedSoloGame {
  version: 1;
  difficulty: Difficulty;
  state: GameState;
  elapsedMs: number;
  savedAt: number;
}

export function loadSoloGame(difficulty: Difficulty): SavedSoloGame | null {
  const saved = readJson<SavedSoloGame>(SAVE_KEY);
  if (!saved || saved.version !== 1 || saved.difficulty !== difficulty) return null;
  return saved.state?.status === 'playing' ? saved : null;
}

export const saveSoloGame = (save: SavedSoloGame): void => writeJson(SAVE_KEY, save);

export const clearSoloGame = (): void => remove(SAVE_KEY);
