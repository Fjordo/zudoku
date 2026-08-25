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
import { AddressLimits, clientAddress, createWindow, withinBudget, type Window } from './limits.js';
import { parseClientMessage } from './parseMessage.js';

interface Session {
  /** Peer address, so the per-connection budgets cannot be multiplied by opening more. */
  address: string;
  roomCode: string | null;
  playerId: string | null;
  alive: boolean;
  /** Sliding window used for basic flood protection. */
  messages: Window;
  /** Separate, tighter window for the actions that cost memory or a room seat. */
  costly: Window;
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
  const limits = new AddressLimits();
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: config.maxMessageBytes,
    verifyClient: (
      info: { origin: string; req: IncomingMessage },
      done: (result: boolean, code?: number, message?: string) => void,
    ) => {
      if (!isAllowedOrigin(info.origin, info.req.headers.host)) {
        done(false, 401, 'Origin not allowed');
        return;
      }
      // Refused at the handshake, before a session and its budgets exist.
      if (!limits.canAccept(clientAddress(info.req))) {
        done(false, 429, 'Too many connections from this address');
        return;
      }
      done(true);
    },
  });
  const sessions = new Map<WebSocket, Session>();
  /** Server-wide budget for costly actions, shared by every connection. */
  const costlyBudget = createWindow(Date.now());

  const send = (socket: WebSocket, message: ServerMessage): void => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const fail = (socket: WebSocket, code: ServerErrorCode, message: string): void =>
    send(socket, { type: 'error', code, message });

  /**
   * Sockets seated in each room. Finding them by walking every session made one
   * `progress` message cost the whole server: with each player allowed 30 a
   * second, the work grew as the square of the connection count.
   */
  const members = new Map<string, Set<WebSocket>>();

  const addMember = (socket: WebSocket, roomCode: string): void => {
    const seated = members.get(roomCode);
    if (seated) seated.add(socket);
    else members.set(roomCode, new Set([socket]));
  };

  const dropMember = (socket: WebSocket, roomCode: string | null): void => {
    if (roomCode === null) return;
    const seated = members.get(roomCode);
    if (!seated) return;
    seated.delete(socket);
    if (seated.size === 0) members.delete(roomCode);
  };

  /** Records the seat this socket holds, on the session and in the index alike. */
  const takeSeat = (socket: WebSocket, session: Session, room: Room, player: Player): void => {
    dropMember(socket, session.roomCode);
    session.roomCode = room.code;
    session.playerId = player.id;
    addMember(socket, room.code);
  };

  /** Forgets the seat this socket holds, without touching the room itself. */
  const clearSeat = (socket: WebSocket, session: Session): void => {
    dropMember(socket, session.roomCode);
    session.roomCode = null;
    session.playerId = null;
  };

  const broadcast = (room: Room, message: ServerMessage): void => {
    for (const socket of members.get(room.code) ?? []) send(socket, message);
  };

  const broadcastRoom = (room: Room): void => broadcast(room, { type: 'room_update', room: room.snapshot() });

  const currentRoom = (session: Session): Room | undefined =>
    session.roomCode ? rooms.find(session.roomCode) : undefined;

  /** Gives up the seat this socket holds, if any. */
  const leaveCurrentRoom = (socket: WebSocket, session: Session): void => {
    const room = currentRoom(session);
    if (room && session.playerId) {
      room.remove(session.playerId);
      // Broadcast before the seat is dropped, so the leaver still sees the room
      // it is stepping out of, exactly as it did before the index existed.
      broadcastRoom(room);
    }
    clearSeat(socket, session);
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
    if (session.roomCode !== null) leaveCurrentRoom(socket, session);

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
    takeSeat(socket, session, room, player);
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
        clearSeat(socket, session);
        broadcastRoom(room);
        break;
    }

    if (statusBefore !== 'finished' && room.status === 'finished') {
      broadcast(room, { type: 'game_over', room: room.snapshot() });
    }
  };

  wss.on('connection', (socket, request) => {
    const now = Date.now();
    const address = clientAddress(request);
    limits.open(address, now);
    const session: Session = {
      address,
      roomCode: null,
      playerId: null,
      alive: true,
      messages: createWindow(now),
      costly: createWindow(now),
    };
    sessions.set(socket, session);

    socket.on('pong', () => {
      session.alive = true;
    });

    socket.on('message', (raw) => {
      const at = Date.now();
      if (!withinBudget(session.messages, at, config.maxMessagesPerSecond, 1000)) {
        fail(socket, 'rate_limited', 'Too many messages.');
        return;
      }
      session.messages.count += 1;
      const message = parseClientMessage(raw.toString());
      if (!message) {
        fail(socket, 'invalid_message', 'Unrecognized message.');
        return;
      }
      if (COSTLY_ACTIONS.has(message.type) && !allowCostly(session, costlyBudget, limits, at)) {
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
      dropMember(socket, session.roomCode);
      if (room && session.playerId) {
        room.disconnect(session.playerId);
        broadcastRoom(room);
      }
      sessions.delete(socket);
      limits.close(session.address, Date.now());
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
    limits.sweep(Date.now());
    const removed = rooms.sweep();
    if (removed > 0) logger.info('rooms swept', { removed, remaining: rooms.size });
  }, config.roomSweepIntervalMs);

  return () => {
    clearInterval(heartbeat);
    clearInterval(sweeper);
    wss.close();
  };
}

/**
 * Charges a costly action against the session, the address and the server-wide
 * budget. Nothing is charged unless all three have room: counting refused
 * attempts let a client that kept hammering after being throttled hold the
 * shared counter above its limit, which locked every other player out of
 * creating or joining a room for as long as the flood lasted.
 */
function allowCostly(session: Session, global: Window, limits: AddressLimits, now: number): boolean {
  const address = limits.costlyWindow(session.address, now);
  const hasBudget =
    withinBudget(session.costly, now, config.maxCostlyActionsPerWindow, config.costlyActionWindowMs) &&
    withinBudget(address, now, config.maxCostlyActionsPerAddressWindow, config.costlyActionWindowMs) &&
    withinBudget(global, now, config.maxCostlyActionsPerSecond, 1000);
  if (!hasBudget) return false;

  session.costly.count += 1;
  address.count += 1;
  global.count += 1;
  return true;
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
