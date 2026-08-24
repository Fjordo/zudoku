import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  gridToString,
  parseGrid,
  solve,
  type ClientMessage,
  type ServerMessage,
} from '@zudoku/shared';
import { RoomManager } from '../rooms/roomManager.js';
import { createGateway } from './gateway.js';

let server: Server;
let closeGateway: () => void;
let port: number;

beforeEach(async () => {
  server = createServer();
  closeGateway = createGateway(server, new RoomManager({ ttlMs: 60_000 }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  port = typeof address === 'object' && address ? address.port : 0;
});

afterEach(async () => {
  closeGateway();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Thin test client that records messages and lets a test await a message type. */
class TestClient {
  private readonly socket: WebSocket;
  private readonly received: ServerMessage[] = [];
  private readonly waiters: { type: ServerMessage['type']; resolve: (message: never) => void }[] = [];

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as ServerMessage;
      this.received.push(message);
      const index = this.waiters.findIndex((waiter) => waiter.type === message.type);
      if (index !== -1) this.waiters.splice(index, 1)[0]?.resolve(message as never);
    });
  }

  static async connect(): Promise<TestClient> {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    await new Promise((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    });
    return new TestClient(socket);
  }

  send(message: ClientMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  /** Resolves with the next message of the given type, including ones already received. */
  next<T extends ServerMessage['type']>(type: T): Promise<Extract<ServerMessage, { type: T }>> {
    const buffered = this.received.find((message) => message.type === type);
    if (buffered) return Promise.resolve(buffered as Extract<ServerMessage, { type: T }>);
    return new Promise((resolve) => this.waiters.push({ type, resolve: resolve as never }));
  }

  forget(): void {
    this.received.length = 0;
  }

  close(): void {
    this.socket.close();
  }
}

describe('websocket gateway', () => {
  it('runs a full race between two players', async () => {
    const host = await TestClient.connect();
    host.send({ type: 'create_room', name: 'Ada', difficulty: 'easy' });
    const hostJoined = await host.next('joined');
    const code = hostJoined.room.code;

    const guest = await TestClient.connect();
    guest.send({ type: 'join_room', code, name: 'Linus' });
    const guestJoined = await guest.next('joined');
    expect(guestJoined.room.players).toHaveLength(2);

    guest.send({ type: 'set_ready', ready: true });
    host.forget();
    host.send({ type: 'start_game' });

    const started = await host.next('game_started');
    const guestStarted = await guest.next('game_started');
    expect(started.puzzle).toBe(guestStarted.puzzle);
    expect(started.room.status).toBe('playing');

    // The server keeps the solution, so the client must submit a valid grid.
    const solution = solveFromPuzzle(started.puzzle);
    guest.forget();
    guest.send({ type: 'finish', grid: solution });
    const afterWin = await guest.next('room_update');
    expect(afterWin.room.winnerId).toBe(guestJoined.playerId);

    host.forget();
    host.send({ type: 'eliminated' });
    const over = await host.next('game_over');
    expect(over.room.status).toBe('finished');
    expect(over.room.players.find((player) => player.id === hostJoined.playerId)?.status).toBe('eliminated');

    host.close();
    guest.close();
  });

  it('rejects an unknown room and a tampered solution', async () => {
    const client = await TestClient.connect();
    client.send({ type: 'join_room', code: 'ZZZZZZ', name: 'Ada' });
    expect((await client.next('error')).code).toBe('room_not_found');

    client.forget();
    client.send({ type: 'create_room', name: 'Ada', difficulty: 'easy' });
    await client.next('joined');
    client.send({ type: 'start_game' });
    const started = await client.next('game_started');

    client.forget();
    client.send({ type: 'finish', grid: started.puzzle.replaceAll('.', '1') });
    expect((await client.next('error')).code).toBe('invalid_solution');

    client.close();
  });

  it('refuses commands from a player who has not joined a room', async () => {
    const client = await TestClient.connect();
    client.send({ type: 'start_game' });
    expect((await client.next('error')).code).toBe('not_in_room');
    client.close();
  });
});

/** Solves the puzzle the way a client would, using the shared engine. */
function solveFromPuzzle(puzzle: string): string {
  const solved = solve(parseGrid(puzzle)).solution;
  if (!solved) throw new Error('unsolvable puzzle');
  return gridToString(solved);
}
