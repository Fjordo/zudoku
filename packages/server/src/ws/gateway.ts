import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerErrorCode, ServerMessage } from '@zudoku/shared';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { RoomFailure, type Room } from '../rooms/room.js';
import type { RoomManager } from '../rooms/roomManager.js';
import { parseClientMessage } from './parseMessage.js';

interface Session {
  roomCode: string | null;
  playerId: string | null;
  alive: boolean;
  /** Sliding window used for basic flood protection. */
  windowStart: number;
  messagesInWindow: number;
}

/** Bridges WebSocket connections to the room domain. */
export function createGateway(server: Server, rooms: RoomManager): () => void {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const sessions = new Map<WebSocket, Session>();

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

  const enterRoom = (socket: WebSocket, session: Session, message: ClientMessage): void => {
    if (message.type !== 'create_room' && message.type !== 'join_room') return;

    const room = message.type === 'create_room' ? rooms.create() : rooms.find(message.code);
    if (!room) {
      fail(socket, 'room_not_found', 'This room code does not exist.');
      return;
    }

    const player = room.join(message.name, message.type === 'join_room' ? message.sessionToken : undefined);
    if (message.type === 'create_room') room.setDifficulty(player.id, message.difficulty);

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
    default:
      return 'Request rejected.';
  }
};
