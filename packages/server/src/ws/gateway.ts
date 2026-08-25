import type { IncomingMessage, Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import {
  normalizeRoomCode,
  type ClientMessage,
  type ServerErrorCode,
  type ServerMessage,
} from '@zudoku/shared';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { RoomFailure, type Player, type Room } from '../rooms/room.js';
import type { RoomManager } from '../rooms/roomManager.js';
import { parseClientMessage } from './parseMessage.js';

interface Session {
  roomCode: string | null;
  playerId: string | null;
  alive: boolean;
  /** Sliding window used for basic flood protection. */
  windowStart: number;
  messagesInWindow: number;
  /** Separate, tighter window for the actions that cost memory or CPU. */
  costlyWindowStart: number;
  costlyActions: number;
}

/** Actions that allocate a room or a seat in one, neither of them free. */
const COSTLY_ACTIONS: ReadonlySet<ClientMessage['type']> = new Set([
  'create_room',
  'join_room',
  'start_game',
]);

/**
 * The same-origin policy does not cover WebSockets and browsers send no
 * preflight, so without this check any site could open room sockets from its
 * visitors' browsers. Clients that are not browsers send no Origin at all and
 * are left alone: they cannot be used to attack a third party's session.
 */
export function isAllowedOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true;
  if (config.allowedOrigins.length > 0) return config.allowedOrigins.includes(origin);

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.host === host) return true;

  // Outside production the Vite dev server proxies /ws from its own port.
  return !config.isProduction && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
}

/** Bridges WebSocket connections to the room domain. */
export function createGateway(server: Server, rooms: RoomManager): () => void {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: config.maxMessageBytes,
    verifyClient: (info: { origin: string; req: IncomingMessage }) =>
      isAllowedOrigin(info.origin, info.req.headers.host),
  });
  const sessions = new Map<WebSocket, Session>();
  /** Server-wide budget for costly actions, shared by every connection. */
  const costlyBudget = { windowStart: Date.now(), count: 0 };

  const send = (socket: WebSocket, message: ServerMessage): void => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const fail = (socket: WebSocket, code: ServerErrorCode, message: string): void =>
    send(socket, { type: 'error', code, message });

  const broadcast = (room: Room, message: ServerMessage): void => {
    for (const [socket, session] of sessions) {
      if (session.roomCode === room.code) send(socket, message);
    }
  };

  const broadcastRoom = (room: Room): void => broadcast(room, { type: 'room_update', room: room.snapshot() });

  const currentRoom = (session: Session): Room | undefined =>
    session.roomCode ? rooms.find(session.roomCode) : undefined;

  /** Gives up the seat this socket holds, if any. */
  const leaveCurrentRoom = (session: Session): void => {
    const room = currentRoom(session);
    if (room && session.playerId) {
      room.remove(session.playerId);
      broadcastRoom(room);
    }
    session.roomCode = null;
    session.playerId = null;
  };

  const enterRoom = (socket: WebSocket, session: Session, message: ClientMessage): void => {
    if (message.type !== 'create_room' && message.type !== 'join_room') return;

    const target = message.type === 'join_room' ? normalizeRoomCode(message.code) : null;

    // One socket holds one seat. Re-entering the room this socket already sits
    // in returns that same seat: allocating a second one overwrote the previous
    // playerId, so nothing would ever disconnect it. The abandoned player stayed
    // marked connected, which kept the room out of the sweeper's reach for good,
    // held the host role hostage and filled the room against real players.
    if (session.roomCode !== null && session.roomCode === target) {
      const current = rooms.find(target);
      const seat = current && session.playerId ? current.getPlayer(session.playerId) : undefined;
      if (current && seat) {
        admit(socket, session, current, seat);
        return;
      }
    }
    if (session.roomCode !== null) leaveCurrentRoom(session);

    if (message.type === 'create_room') {
      const created = rooms.create();
      if (!created) {
        fail(socket, 'server_busy', 'The server is at capacity, try again shortly.');
        return;
      }
      const host = created.join(message.name);
      created.setDifficulty(host.id, message.difficulty);
      admit(socket, session, created, host);
      return;
    }

    const room = rooms.find(message.code);
    if (!room) {
      fail(socket, 'room_not_found', 'This room code does not exist.');
      return;
    }
    admit(socket, session, room, room.join(message.name, message.sessionToken));
  };

  const admit = (socket: WebSocket, session: Session, room: Room, player: Player): void => {
    session.roomCode = room.code;
    session.playerId = player.id;
    send(socket, {
      type: 'joined',
      room: room.snapshot(),
      playerId: player.id,
      sessionToken: player.sessionToken,
    });

    // A player reconnecting mid-race needs the puzzle again.
    if (room.status !== 'lobby' && room.puzzle && room.startedAt !== null) {
      send(socket, {
        type: 'game_started',
        room: room.snapshot(),
        puzzle: room.puzzle.puzzle,
        startedAt: room.startedAt,
        elapsedMs: Date.now() - room.startedAt,
      });
    }
    broadcastRoom(room);
  };

  const handle = (socket: WebSocket, session: Session, message: ClientMessage): void => {
    if (message.type === 'ping') {
      send(socket, { type: 'pong' });
      return;
    }
    if (message.type === 'create_room' || message.type === 'join_room') {
      enterRoom(socket, session, message);
      return;
    }

    const room = currentRoom(session);
    const playerId = session.playerId;
    if (!room || !playerId) {
      fail(socket, 'not_in_room', 'Join a room first.');
      return;
    }

    const statusBefore = room.status;

    switch (message.type) {
      case 'set_ready':
        room.setReady(playerId, message.ready);
        broadcastRoom(room);
        break;
      case 'set_difficulty':
        room.setDifficulty(playerId, message.difficulty);
        broadcastRoom(room);
        break;
      case 'start_game': {
        const puzzle = room.start(playerId);
        broadcast(room, {
          type: 'game_started',
          room: room.snapshot(),
          puzzle: puzzle.puzzle,
          startedAt: room.startedAt ?? Date.now(),
          elapsedMs: 0,
        });
        logger.info('game started', { room: room.code, difficulty: room.difficulty });
        break;
      }
      case 'progress':
        room.reportProgress(playerId, message.filledCells, message.mistakes);
        broadcastRoom(room);
        break;
      case 'eliminated':
        room.eliminate(playerId);
        broadcastRoom(room);
        break;
      case 'finish':
        room.submitSolution(playerId, message.grid);
        broadcastRoom(room);
        break;
      case 'leave':
        room.remove(playerId);
        session.roomCode = null;
        session.playerId = null;
        broadcastRoom(room);
        break;
    }

    if (statusBefore !== 'finished' && room.status === 'finished') {
      broadcast(room, { type: 'game_over', room: room.snapshot() });
    }
  };

  wss.on('connection', (socket) => {
    const session: Session = {
      roomCode: null,
      playerId: null,
      alive: true,
      windowStart: Date.now(),
      messagesInWindow: 0,
      costlyWindowStart: Date.now(),
      costlyActions: 0,
    };
    sessions.set(socket, session);

    socket.on('pong', () => {
      session.alive = true;
    });

    socket.on('message', (raw) => {
      if (isFlooding(session)) {
        fail(socket, 'rate_limited', 'Too many messages.');
        return;
      }
      const message = parseClientMessage(raw.toString());
      if (!message) {
        fail(socket, 'invalid_message', 'Unrecognized message.');
        return;
      }
      if (COSTLY_ACTIONS.has(message.type) && !allowCostly(session, costlyBudget)) {
        fail(socket, 'rate_limited', 'Too many rooms in a row.');
        return;
      }
      try {
        handle(socket, session, message);
      } catch (error) {
        if (error instanceof RoomFailure) {
          fail(socket, error.code, describe(error.code));
        } else {
          logger.error('gateway failure', { error: String(error) });
          fail(socket, 'invalid_message', 'Unexpected server error.');
        }
      }
    });

    socket.on('close', () => {
      const room = currentRoom(session);
      if (room && session.playerId) {
        room.disconnect(session.playerId);
        broadcastRoom(room);
      }
      sessions.delete(socket);
    });

    socket.on('error', (error) => logger.warn('socket error', { error: String(error) }));
  });

  const heartbeat = setInterval(() => {
    for (const [socket, session] of sessions) {
      if (!session.alive) {
        socket.terminate();
        continue;
      }
      session.alive = false;
      socket.ping();
    }
  }, config.heartbeatIntervalMs);

  const sweeper = setInterval(() => {
    const removed = rooms.sweep();
    if (removed > 0) logger.info('rooms swept', { removed, remaining: rooms.size });
  }, config.roomSweepIntervalMs);

  return () => {
    clearInterval(heartbeat);
    clearInterval(sweeper);
    wss.close();
  };
}

interface Budget {
  windowStart: number;
  count: number;
}

/** Charges a costly action against the session budget and the server-wide one. */
function allowCostly(session: Session, global: Budget): boolean {
  const now = Date.now();
  if (now - session.costlyWindowStart >= config.costlyActionWindowMs) {
    session.costlyWindowStart = now;
    session.costlyActions = 0;
  }
  session.costlyActions += 1;
  if (now - global.windowStart >= 1000) {
    global.windowStart = now;
    global.count = 0;
  }
  global.count += 1;
  return (
    session.costlyActions <= config.maxCostlyActionsPerWindow &&
    global.count <= config.maxCostlyActionsPerSecond
  );
}

function isFlooding(session: Session): boolean {
  const now = Date.now();
  if (now - session.windowStart >= 1000) {
    session.windowStart = now;
    session.messagesInWindow = 0;
  }
  session.messagesInWindow += 1;
  return session.messagesInWindow > config.maxMessagesPerSecond;
}

const describe = (code: ServerErrorCode): string => {
  switch (code) {
    case 'room_full':
      return 'This room is full.';
    case 'room_in_progress':
      return 'This game has already started.';
    case 'not_host':
      return 'Only the host can do that.';
    case 'invalid_solution':
      return 'That grid is not a valid solution.';
    case 'server_busy':
      return 'The server is at capacity, try again shortly.';
    default:
      return 'Request rejected.';
  }
};
