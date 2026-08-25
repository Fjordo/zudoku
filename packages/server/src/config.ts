import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? '0.0.0.0',
  /** Built client assets served by this server. */
  clientDir: process.env.CLIENT_DIR ?? path.resolve(here, '../../client/dist'),
  /** Rooms without any connected player for this long are discarded. */
  roomTtlMs: Number(process.env.ROOM_TTL_MS ?? 30 * 60 * 1000),
  roomSweepIntervalMs: 60 * 1000,
  /** Interval between WebSocket liveness probes. */
  heartbeatIntervalMs: 30 * 1000,
  maxMessagesPerSecond: 30,
  /** Largest accepted WebSocket frame. Every protocol message is a few hundred bytes. */
  maxMessageBytes: 16 * 1024,
} as const;
