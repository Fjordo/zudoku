import {
  MAX_MISTAKES,
  MAX_PLAYERS_PER_ROOM,
  generatePuzzle,
  parseGrid,
  isSolved,
  type Difficulty,
  type PlayerSnapshot,
  type Puzzle,
  type RoomSnapshot,
  type RoomStatus,
} from '@zudoku/shared';

export interface Player {
  id: string;
  name: string;
  /** Secret used by the client to reclaim its seat after a reconnect. */
  sessionToken: string;
  ready: boolean;
  connected: boolean;
  status: PlayerSnapshot['status'];
  filledCells: number;
  mistakes: number;
  finishTimeMs: number | null;
  rank: number | null;
}

export interface RoomDeps {
  now: () => number;
  createId: () => string;
  createPuzzle: (difficulty: Difficulty) => Puzzle;
}

export const defaultRoomDeps: RoomDeps = {
  now: () => Date.now(),
  createId: () => crypto.randomUUID(),
  createPuzzle: (difficulty) => generatePuzzle(difficulty),
};

export type RoomErrorCode =
  | 'room_full'
  | 'room_in_progress'
  | 'invalid_solution'
  | 'not_host'
  | 'server_busy';

export class RoomFailure extends Error {
  constructor(readonly code: RoomErrorCode) {
    super(code);
    this.name = 'RoomFailure';
  }
}

/** A challenge room: a lobby that turns into a race on one shared puzzle. */
export class Room {
  status: RoomStatus = 'lobby';
  difficulty: Difficulty = 'medium';
  puzzle: Puzzle | null = null;
  startedAt: number | null = null;
  winnerId: string | null = null;
  lastActivityAt: number;

  private readonly players = new Map<string, Player>();
  private hostId = '';

  constructor(
    readonly code: string,
    private readonly deps: RoomDeps = defaultRoomDeps,
  ) {
    this.lastActivityAt = deps.now();
  }

  get playerCount(): number {
    return this.players.size;
  }

  get connectedCount(): number {
    return [...this.players.values()].filter((player) => player.connected).length;
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  findByToken(sessionToken: string): Player | undefined {
    return [...this.players.values()].find((player) => player.sessionToken === sessionToken);
  }

  isHost(playerId: string): boolean {
    return this.hostId === playerId;
  }

  /** Adds a player, or restores one presenting a valid session token. */
  join(name: string, sessionToken?: string): Player {
    this.touch();
    const existing = sessionToken ? this.findByToken(sessionToken) : undefined;
    if (existing) {
      existing.connected = true;
      if (name) existing.name = name;
      this.reassignHostIfNeeded();
      return existing;
    }
    if (this.status !== 'lobby') throw new RoomFailure('room_in_progress');
    if (this.players.size >= MAX_PLAYERS_PER_ROOM) throw new RoomFailure('room_full');

    const player: Player = {
      id: this.deps.createId(),
      name,
      sessionToken: this.deps.createId(),
      ready: false,
      connected: true,
      status: 'idle',
      filledCells: 0,
      mistakes: 0,
      finishTimeMs: null,
      rank: null,
    };
    this.players.set(player.id, player);
    if (!this.hostId) this.hostId = player.id;
    return player;
  }

  /** Player is gone: dropped while in the lobby, kept during a game so they can reconnect. */
  disconnect(playerId: string): void {
    this.touch();
    const player = this.players.get(playerId);
    if (!player) return;
    if (this.status === 'lobby') this.players.delete(playerId);
    else player.connected = false;
    this.reassignHostIfNeeded();
    this.finishIfEveryoneIsDone();
  }

  remove(playerId: string): void {
    this.touch();
    this.players.delete(playerId);
    this.reassignHostIfNeeded();
    this.finishIfEveryoneIsDone();
  }

  setReady(playerId: string, ready: boolean): void {
    this.touch();
    const player = this.players.get(playerId);
    if (player) player.ready = ready;
  }

  setDifficulty(playerId: string, difficulty: Difficulty): void {
    this.touch();
    if (!this.isHost(playerId)) throw new RoomFailure('not_host');
    if (this.status !== 'lobby') throw new RoomFailure('room_in_progress');
    this.difficulty = difficulty;
  }

  /** Host only: generates the shared puzzle and starts the race. */
  start(playerId: string): Puzzle {
    this.touch();
    if (!this.isHost(playerId)) throw new RoomFailure('not_host');
    if (this.status === 'playing') throw new RoomFailure('room_in_progress');

    this.puzzle = this.deps.createPuzzle(this.difficulty);
    this.status = 'playing';
    this.startedAt = this.deps.now();
    this.winnerId = null;
    for (const player of this.players.values()) {
      player.status = 'playing';
      player.ready = false;
      player.filledCells = 0;
      player.mistakes = 0;
      player.finishTimeMs = null;
      player.rank = null;
    }
    return this.puzzle;
  }

  reportProgress(playerId: string, filledCells: number, mistakes: number): void {
    this.touch();
    const player = this.players.get(playerId);
    if (!player || player.status !== 'playing') return;
    player.filledCells = clamp(filledCells, 0, 81);
    player.mistakes = clamp(mistakes, 0, MAX_MISTAKES);
  }

  eliminate(playerId: string): void {
    this.touch();
    const player = this.players.get(playerId);
    if (!player || player.status !== 'playing') return;
    player.status = 'eliminated';
    player.mistakes = MAX_MISTAKES;
    this.finishIfEveryoneIsDone();
  }

  /** Validates a submitted grid server-side and records the finishing time. */
  submitSolution(playerId: string, grid: string): Player {
    this.touch();
    const player = this.players.get(playerId);
    if (!player || player.status !== 'playing' || !this.puzzle || this.startedAt === null) {
      throw new RoomFailure('invalid_solution');
    }
    if (!this.matchesPuzzle(grid)) throw new RoomFailure('invalid_solution');

    player.status = 'finished';
    player.filledCells = 81;
    player.finishTimeMs = this.deps.now() - this.startedAt;
    player.rank = countFinished(this.players);
    this.winnerId ??= player.id;
    this.finishIfEveryoneIsDone();
    return player;
  }

  snapshot(): RoomSnapshot {
    return {
      code: this.code,
      status: this.status,
      difficulty: this.difficulty,
      hostId: this.hostId,
      startedAt: this.startedAt,
      winnerId: this.winnerId,
      players: [...this.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.id === this.hostId,
        ready: player.ready,
        connected: player.connected,
        status: player.status,
        filledCells: player.filledCells,
        mistakes: player.mistakes,
        finishTimeMs: player.finishTimeMs,
        rank: player.rank,
      })),
    };
  }

  /** A submission counts only if it solves the grid and keeps every original clue. */
  private matchesPuzzle(grid: string): boolean {
    if (!this.puzzle) return false;
    let submitted: number[];
    try {
      submitted = parseGrid(grid);
    } catch {
      return false;
    }
    if (!isSolved(submitted)) return false;
    return parseGrid(this.puzzle.puzzle).every((clue, index) => clue === 0 || clue === submitted[index]);
  }

  private reassignHostIfNeeded(): void {
    if (this.players.get(this.hostId)?.connected) return;
    const candidate =
      [...this.players.values()].find((player) => player.connected) ?? [...this.players.values()][0];
    this.hostId = candidate?.id ?? '';
  }

  private finishIfEveryoneIsDone(): void {
    if (this.status !== 'playing') return;
    const stillPlaying = [...this.players.values()].some((player) => player.status === 'playing');
    if (!stillPlaying) this.status = 'finished';
  }

  private touch(): void {
    this.lastActivityAt = this.deps.now();
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min;

const countFinished = (players: Map<string, Player>): number =>
  [...players.values()].filter((player) => player.status === 'finished').length;
