import { describe, expect, it } from 'vitest';
import { generatePuzzle, type Difficulty } from '@zudoku/shared';
import { Room, RoomFailure, type RoomDeps } from './room.js';
import { RoomManager } from './roomManager.js';

/** Deterministic dependencies so tests can control time, ids and the puzzle. */
function createDeps(overrides: Partial<RoomDeps> = {}) {
  let clock = 1_000;
  let nextId = 0;
  const deps: RoomDeps = {
    now: () => clock,
    createId: () => `id-${(nextId += 1)}`,
    createPuzzle: (difficulty: Difficulty) => generatePuzzle(difficulty, 4242),
    ...overrides,
  };
  return { deps, advance: (ms: number) => (clock += ms) };
}

describe('Room', () => {
  it('makes the first player host and keeps ids stable', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const guest = room.join('Linus');

    expect(room.isHost(host.id)).toBe(true);
    expect(room.isHost(guest.id)).toBe(false);
    expect(room.snapshot().players.map((player) => player.name)).toEqual(['Ada', 'Linus']);
  });

  it('lets only the host change difficulty and start the game', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const guest = room.join('Linus');

    expect(() => room.setDifficulty(guest.id, 'hard')).toThrow(RoomFailure);
    room.setDifficulty(host.id, 'hard');
    expect(room.difficulty).toBe('hard');

    expect(() => room.start(guest.id)).toThrow(RoomFailure);
    const puzzle = room.start(host.id);
    expect(puzzle.difficulty).toBe('hard');
    expect(room.status).toBe('playing');
    expect(room.snapshot().players.every((player) => player.status === 'playing')).toBe(true);
  });

  it('rejects joining a room in progress but allows reconnecting with a token', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    room.start(host.id);

    expect(() => room.join('Latecomer')).toThrow(RoomFailure);

    room.disconnect(host.id);
    expect(room.snapshot().players[0].connected).toBe(false);
    const restored = room.join('Ada', host.sessionToken);
    expect(restored.id).toBe(host.id);
    expect(restored.connected).toBe(true);
  });

  it('accepts a correct solution and records the finishing order', () => {
    const { deps, advance } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const guest = room.join('Linus');
    const puzzle = room.start(host.id);

    advance(5_000);
    const winner = room.submitSolution(guest.id, puzzle.solution);
    expect(winner.finishTimeMs).toBe(5_000);
    expect(winner.rank).toBe(1);
    expect(room.winnerId).toBe(guest.id);
    expect(room.status).toBe('playing');

    advance(3_000);
    const second = room.submitSolution(host.id, puzzle.solution);
    expect(second.rank).toBe(2);
    expect(second.finishTimeMs).toBe(8_000);
    expect(room.winnerId).toBe(guest.id);
    expect(room.status).toBe('finished');
  });

  it('rejects grids that are wrong or tamper with the clues', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const puzzle = room.start(host.id);

    expect(() => room.submitSolution(host.id, '.'.repeat(81))).toThrow(RoomFailure);
    expect(() => room.submitSolution(host.id, 'nonsense')).toThrow(RoomFailure);

    const shuffled = [...puzzle.solution].reverse().join('');
    expect(() => room.submitSolution(host.id, shuffled)).toThrow(RoomFailure);
    expect(room.getPlayer(host.id)?.status).toBe('playing');
  });

  it('ends the game when every player is out', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const guest = room.join('Linus');
    room.start(host.id);

    room.eliminate(host.id);
    expect(room.status).toBe('playing');
    room.eliminate(guest.id);
    expect(room.status).toBe('finished');
    expect(room.winnerId).toBeNull();
  });

  it('clamps reported progress to the board size', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    room.start(host.id);

    room.reportProgress(host.id, 999, 99);
    const player = room.snapshot().players[0];
    expect(player.filledCells).toBe(81);
    expect(player.mistakes).toBe(3);
  });

  it('promotes another player when the host leaves', () => {
    const { deps } = createDeps();
    const room = new Room('ABC123', deps);
    const host = room.join('Ada');
    const guest = room.join('Linus');

    room.remove(host.id);
    expect(room.isHost(guest.id)).toBe(true);
  });
});

describe('RoomManager', () => {
  it('issues unique codes and looks rooms up case-insensitively', () => {
    const manager = new RoomManager({ ttlMs: 1000 });
    const room = manager.create();

    expect(room.code).toHaveLength(6);
    expect(manager.find(room.code.toLowerCase())).toBe(room);
    expect(manager.find('ZZZZZZ')).toBeUndefined();
    expect(manager.create().code).not.toBe(room.code);
  });

  it('sweeps empty and idle rooms', () => {
    let clock = 0;
    const manager = new RoomManager({ ttlMs: 1_000, deps: { now: () => clock } });
    const empty = manager.create();
    const busy = manager.create();
    busy.join('Ada');

    expect(manager.sweep()).toBe(1);
    expect(manager.find(empty.code)).toBeUndefined();

    busy.disconnect(busy.snapshot().players[0].id);
    clock += 5_000;
    expect(manager.sweep()).toBe(1);
    expect(manager.size).toBe(0);
  });
});
