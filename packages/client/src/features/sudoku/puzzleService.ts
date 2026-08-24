import { generatePuzzle, type Difficulty, type Puzzle } from '@zudoku/shared';
import type { PuzzleRequest, PuzzleResponse } from './puzzleWorker';

let worker: Worker | null = null;
let nextRequestId = 1;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  worker ??= new Worker(new URL('./puzzleWorker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/** Generates a puzzle in a worker, falling back to the main thread when unavailable. */
export function createPuzzle(difficulty: Difficulty): Promise<Puzzle> {
  const instance = getWorker();
  if (!instance) return Promise.resolve(generatePuzzle(difficulty));

  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<PuzzleResponse>) => {
      if (event.data.id !== id) return;
      cleanup();
      resolve(event.data.puzzle);
    };
    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message));
    };
    const cleanup = () => {
      instance.removeEventListener('message', onMessage);
      instance.removeEventListener('error', onError);
    };

    instance.addEventListener('message', onMessage);
    instance.addEventListener('error', onError);
    instance.postMessage({ id, difficulty } satisfies PuzzleRequest);
  });
}
