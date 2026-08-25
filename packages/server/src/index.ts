import { createServer } from 'node:http';
import { config } from './config.js';
import { logger } from './logger.js';
import { createApp } from './http/app.js';
import { PuzzlePool } from './rooms/puzzlePool.js';
import { RoomManager } from './rooms/roomManager.js';
import { createGateway } from './ws/gateway.js';

// Puzzles are generated on a timer instead of on the socket, so no amount of
// traffic can turn the synchronous generator into an event-loop stall.
const puzzles = new PuzzlePool();
const stopPuzzles = puzzles.start();

const rooms = new RoomManager({
  ttlMs: config.roomTtlMs,
  maxRooms: config.maxRooms,
  deps: { createPuzzle: puzzles.take },
});
const server = createServer(createApp(rooms));
const closeGateway = createGateway(server, rooms);

server.listen(config.port, config.host, () => {
  logger.info('server listening', { port: config.port, host: config.host, clientDir: config.clientDir });
});

const shutdown = (signal: string): void => {
  logger.info('shutting down', { signal });
  closeGateway();
  stopPuzzles();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
