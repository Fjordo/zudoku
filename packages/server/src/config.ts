import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const originList = (value: string | undefined): readonly string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? '0.0.0.0',
  /** Built client assets served by this server. */
  clientDir: process.env.CLIENT_DIR ?? path.resolve(here, '../../client/dist'),
  /** Rooms without any connected player for this long are discarded. */
  roomTtlMs: Number(process.env.ROOM_TTL_MS ?? 30 * 60 * 1000),
  roomSweepIntervalMs: 60 * 1000,
  /** Interval between WebSocket liveness probes. */
  heartbeatIntervalMs: 30 * 1000,
  /**
   * Origins allowed to open a room socket. Empty means "whatever host the
   * request was addressed to", which is what a same-origin deployment needs.
   */
  allowedOrigins: originList(process.env.ALLOWED_ORIGINS),
  maxMessagesPerSecond: 30,
  /**
   * Creating a room and starting a game allocate memory and block the event
   * loop on puzzle generation, so they get a much tighter budget of their own.
   */
  maxCostlyActionsPerWindow: 6,
  costlyActionWindowMs: 10 * 1000,
  /** Same budget across every connection, so a fleet of sockets cannot stall the loop. */
  maxCostlyActionsPerSecond: 10,
  /** Hard ceiling on live rooms: a flood degrades into an error, not an OOM. */
  maxRooms: Number(process.env.MAX_ROOMS ?? 2000),
  /** Largest accepted WebSocket frame. Every protocol message is a few hundred bytes. */
  maxMessageBytes: 16 * 1024,
} as const;
