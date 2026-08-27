import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * The app ships as one unit, so the root manifest is the only place its version
 * is written — the workspace manifests carry none. Both `src` (dev) and `dist`
 * (built) sit two levels under `packages/`, and the Dockerfile copies the root
 * manifest into the image, so this resolves the same way everywhere.
 */
const { version } = JSON.parse(
  readFileSync(path.resolve(here, '../../../package.json'), 'utf8'),
) as { version: string };

const originList = (value: string | undefined): readonly string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const config = {
  /** Reported by /healthz so a deployed machine can be matched to a build. */
  version,
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
   * Creating a room and joining one allocate memory, so they get a much tighter
   * budget of their own. Starting a game is charged the same way even though the
   * puzzle it hands out is pre-generated (see `PuzzlePool`).
   */
  maxCostlyActionsPerWindow: 6,
  costlyActionWindowMs: 10 * 1000,
  /**
   * Same budget per address, so opening a fleet of sockets does not multiply the
   * per-connection allowance.
   */
  maxCostlyActionsPerAddressWindow: 20,
  /**
   * Server-wide backstop. It sits well above what one address may spend, because
   * a limit low enough for a single client to exhaust turns the limiter itself
   * into the outage: everyone else gets `rate_limited` on create and join.
   */
  maxCostlyActionsPerSecond: 60,
  /** Concurrent sockets one address may hold open. */
  maxSocketsPerAddress: Number(process.env.MAX_SOCKETS_PER_ADDRESS ?? 12),
  /**
   * Read the forwarded client address instead of the socket peer. Only turn this
   * on behind a proxy that overwrites the header, otherwise a client picks its
   * own identity and every per-address limit above becomes decorative.
   */
  trustProxy: process.env.TRUST_PROXY === '1',
  /** Warm puzzles kept ready per difficulty, and how often one is generated. */
  puzzlePoolSize: Number(process.env.PUZZLE_POOL_SIZE ?? 8),
  puzzlePoolRefillMs: 500,
  /** Hard ceiling on live rooms: a flood degrades into an error, not an OOM. */
  maxRooms: Number(process.env.MAX_ROOMS ?? 2000),
  /** Largest accepted WebSocket frame. Every protocol message is a few hundred bytes. */
  maxMessageBytes: 16 * 1024,
} as const;
