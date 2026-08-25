import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '@zudoku/shared';
import { PuzzlePool } from './puzzlePool.js';

/** One puzzle of every difficulty, whatever the ladder currently holds. */
const everyDifficulty = (depth: number) =>
  Object.fromEntries(DIFFICULTIES.map((difficulty) => [difficulty, depth]));

describe('PuzzlePool', () => {
  it('serves a puzzle that was generated before the request arrived', () => {
    const pool = new PuzzlePool(1);
    for (const _ of DIFFICULTIES) pool.refill();
    expect(pool.depth).toEqual(everyDifficulty(1));

    const puzzle = pool.take('medium');
    expect(puzzle.difficulty).toBe('medium');
    expect(pool.depth.medium).toBe(0);
  });

  it('reports a busy server rather than generating on the spot when it runs dry', () => {
    const pool = new PuzzlePool(1);

    // This is what bounds the cost of a start_game flood: an empty pool answers
    // with an error, so generation never runs on the path of an inbound message.
    expect(() => pool.take('hard')).toThrow('server_busy');
  });

  it('generates one puzzle per refill and stops at the target depth', () => {
    const pool = new PuzzlePool(1);

    expect(pool.refill()).toBe(true);
    expect(Object.values(pool.depth).reduce((total, depth) => total + depth, 0)).toBe(1);

    for (let remaining = DIFFICULTIES.length - 1; remaining > 0; remaining -= 1) {
      expect(pool.refill()).toBe(true);
    }
    expect(pool.refill()).toBe(false);
    expect(pool.depth).toEqual(everyDifficulty(1));
  });
});
