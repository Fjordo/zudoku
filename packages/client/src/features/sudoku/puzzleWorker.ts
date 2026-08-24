/// <reference lib="webworker" />
import { generatePuzzle, type Difficulty, type Puzzle } from '@zudoku/shared';

export interface PuzzleRequest {
  id: number;
  difficulty: Difficulty;
}

export interface PuzzleResponse {
  id: number;
  puzzle: Puzzle;
}

// Generation is CPU bound (uniqueness checks plus grading), so it runs off the UI thread.
self.addEventListener('message', (event: MessageEvent<PuzzleRequest>) => {
  const { id, difficulty } = event.data;
  const response: PuzzleResponse = { id, puzzle: generatePuzzle(difficulty) };
  self.postMessage(response);
});
