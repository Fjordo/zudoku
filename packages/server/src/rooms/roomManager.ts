import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, normalizeRoomCode } from '@zudoku/shared';
import { Room, defaultRoomDeps, type RoomDeps } from './room.js';

export interface RoomManagerOptions {
  /** Rooms idle for longer than this are dropped by `sweep`. */
  ttlMs: number;
  /** Ceiling on live rooms; `create` returns null once it is reached. */
  maxRooms?: number;
  deps?: Partial<RoomDeps>;
}

/** In-memory registry of challenge rooms. Rooms are ephemeral by design. */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();
  private readonly deps: RoomDeps;

  constructor(private readonly options: RoomManagerOptions) {
    this.deps = { ...defaultRoomDeps, ...options.deps };
  }

  get size(): number {
    return this.rooms.size;
  }

  /** Returns null when the registry is full rather than growing without bound. */
  create(): Room | null {
    if (this.rooms.size >= (this.options.maxRooms ?? Infinity)) return null;
    const room = new Room(this.generateCode(), this.deps);
    this.rooms.set(room.code, room);
    return room;
  }

  find(code: string): Room | undefined {
    return this.rooms.get(normalizeRoomCode(code));
  }

  delete(code: string): void {
    this.rooms.delete(normalizeRoomCode(code));
  }

  /** Removes rooms that are empty or idle past the TTL. Returns how many were dropped. */
  sweep(): number {
    const cutoff = this.deps.now() - this.options.ttlMs;
    let removed = 0;
    for (const [code, room] of this.rooms) {
      const idle = room.connectedCount === 0 && room.lastActivityAt < cutoff;
      if (idle || room.playerCount === 0) {
        this.rooms.delete(code);
        removed += 1;
      }
    }
    return removed;
  }

  private generateCode(): string {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const code = Array.from(
        { length: ROOM_CODE_LENGTH },
        () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)],
      ).join('');
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Unable to allocate a free room code');
  }
}
