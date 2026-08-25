import { createServer } from 'node:http';
import { config } from './config.js';
import { logger } from './logger.js';
import { createApp } from './http/app.js';
import { RoomManager } from './rooms/roomManager.js';
import { createGateway } from './ws/gateway.js';

const rooms = new RoomManager({ ttlMs: config.roomTtlMs, maxRooms: config.maxRooms });
const server = createServer(createApp(rooms));
const closeGateway = createGateway(server, rooms);

server.listen(config.port, config.host, () => {
  logger.info('server listening', { port: config.port, host: config.host, clientDir: config.clientDir });
});

const shutdown = (signal: string): void => {
  logger.info('shutting down', { signal });
  closeGateway();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
