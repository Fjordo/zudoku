import { DIFFICULTIES, generatePuzzle, type Difficulty, type Puzzle } from '@zudoku/shared';
import { config } from '../config.js';
import { RoomFailure } from './room.js';

/** Puzzles generated up front so a race never waits on the generator. */
const warmUpPerDifficulty = 2;

/**
 * Generating a puzzle is synchronous and costs tens of milliseconds, so doing it
 * on the path of an inbound message let a stream of `start_game` hold the event
 * loop for a large share of every second: heartbeats, broadcasts and HTTP all
 * queued behind it.
 *
 * The pool moves generation onto a timer the server owns. A race takes a puzzle
 * that is already sitting there, and however hard the socket is pushed the
 * server still generates at most one puzzle per refill tick. Draining the pool
 * therefore costs the attacker a `server_busy` answer rather than the event loop.
 */
export class PuzzlePool {
  private readonly ready = new Map<Difficulty, Puzzle[]>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly size: number = config.puzzlePoolSize) {
    for (const difficulty of DIFFICULTIES) this.ready.set(difficulty, []);
  }

  /** How many puzzles are waiting, for the health check and for tests. */
  get depth(): Record<Difficulty, number> {
    return Object.fromEntries(
      [...this.ready].map(([difficulty, puzzles]) => [difficulty, puzzles.length]),
    ) as Record<Difficulty, number>;
  }

  /**
   * Hands out a warm puzzle. Bound so it can be passed straight to `RoomDeps`.
   * An empty pool is reported as a busy server instead of generating inline,
   * which is what keeps the ceiling above a hard one.
   */
  readonly take = (difficulty: Difficulty): Puzzle => {
    const puzzle = this.ready.get(difficulty)?.pop();
    if (!puzzle) throw new RoomFailure('server_busy');
    return puzzle;
  };

  /** Generates at most one puzzle, for whichever difficulty is furthest behind. */
  refill(): boolean {
    let target: Difficulty | null = null;
    let shortest = this.size;
    for (const [difficulty, puzzles] of this.ready) {
      if (puzzles.length < shortest) {
        shortest = puzzles.length;
        target = difficulty;
      }
    }
    if (target === null) return false;
    this.ready.get(target)?.push(generatePuzzle(target));
    return true;
  }

  /**
   * Warms enough of the pool to serve the first races, then keeps topping it up.
   * Returns the stop function.
   */
  start(): () => void {
    for (let i = 0; i < warmUpPerDifficulty * DIFFICULTIES.length; i += 1) {
      if (this.depthIsAtLeast(warmUpPerDifficulty)) break;
      this.refill();
    }
    this.timer = setInterval(() => this.refill(), config.puzzlePoolRefillMs);
    return () => {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    };
  }

  private depthIsAtLeast(count: number): boolean {
    return [...this.ready.values()].every((puzzles) => puzzles.length >= count);
  }
}
