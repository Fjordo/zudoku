/** Wire protocol shared by the WebSocket server and the browser client. */
import type { Difficulty } from './sudoku/difficulty.js';

export const ROOM_CODE_LENGTH = 6;
/** Ambiguous characters (0/O, 1/I) are excluded to keep codes easy to dictate. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const MAX_PLAYERS_PER_ROOM = 8;
export const MAX_NAME_LENGTH = 20;

export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type PlayerStatus = 'idle' | 'playing' | 'finished' | 'eliminated';

export interface PlayerSnapshot {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  status: PlayerStatus;
  filledCells: number;
  mistakes: number;
  /** Elapsed milliseconds at completion, set once the player finishes. */
  finishTimeMs: number | null;
  /** Finishing position, 1-based. */
  rank: number | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  difficulty: Difficulty;
  hostId: string;
  players: PlayerSnapshot[];
  startedAt: number | null;
  winnerId: string | null;
}

export type ClientMessage =
  | { type: 'create_room'; name: string; difficulty: Difficulty }
  | { type: 'join_room'; code: string; name: string; sessionToken?: string }
  | { type: 'set_ready'; ready: boolean }
  | { type: 'set_difficulty'; difficulty: Difficulty }
  | { type: 'start_game' }
  | { type: 'progress'; filledCells: number; mistakes: number }
  | { type: 'finish'; grid: string }
  | { type: 'eliminated' }
  | { type: 'leave' }
  | { type: 'ping' };

export type ServerErrorCode =
  | 'room_not_found'
  | 'room_full'
  | 'room_in_progress'
  | 'not_host'
  | 'invalid_message'
  | 'invalid_name'
  | 'not_in_room'
  | 'invalid_solution'
  | 'rate_limited'
  | 'server_busy';

export type ServerMessage =
  | { type: 'joined'; room: RoomSnapshot; playerId: string; sessionToken: string }
  | { type: 'room_update'; room: RoomSnapshot }
  | {
      type: 'game_started';
      room: RoomSnapshot;
      puzzle: string;
      startedAt: number;
      /** Milliseconds already elapsed, so a reconnecting client can align its timer. */
      elapsedMs: number;
    }
  | { type: 'game_over'; room: RoomSnapshot }
  | { type: 'error'; code: ServerErrorCode; message: string }
  | { type: 'pong' };

export const normalizeRoomCode = (code: string): string => code.trim().toUpperCase();

export const isValidRoomCode = (code: string): boolean =>
  new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`).test(normalizeRoomCode(code));

/**
 * A name sits next to the other players, so anything that can forge that
 * display is dropped before it is stored: control characters, the bidi
 * overrides that make a name render backwards or swallow the label beside it,
 * and the zero-width characters that let two players share one apparent name.
 */
export const sanitizePlayerName = (name: string): string =>
  name
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
