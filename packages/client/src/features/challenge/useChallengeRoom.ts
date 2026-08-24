import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  Difficulty,
  RoomSnapshot,
  ServerErrorCode,
  ServerMessage,
} from '@zudoku/shared';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';

export interface ChallengeState {
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  playerId: string | null;
  /** Puzzle for the current race, sent when the host starts it. */
  puzzle: string | null;
  /** Local timestamp the race started at, derived from the server elapsed time. */
  startedAt: number | null;
  /** Last error reported by the server; the UI translates the code. */
  error: ServerErrorCode | null;
}

export interface ChallengeApi extends ChallengeState {
  createRoom: (name: string, difficulty: Difficulty) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  startGame: () => void;
  reportProgress: (filledCells: number, mistakes: number) => void;
  reportEliminated: () => void;
  submitSolution: (grid: string) => void;
  leave: () => void;
  dismissError: () => void;
}

/** What the hook re-sends after a reconnect. */
interface Intent {
  kind: 'create' | 'join';
  name: string;
  difficulty: Difficulty;
  code?: string;
}

const INITIAL: ChallengeState = {
  status: 'idle',
  room: null,
  playerId: null,
  puzzle: null,
  startedAt: null,
  error: null,
};

const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000];
const sessionKey = (code: string): string => `zudoku.session.${code}`;

const socketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
};

/** Owns the WebSocket for one challenge room, including reconnects. */
export function useChallengeRoom(): ChallengeApi {
  const [state, setState] = useState<ChallengeState>(INITIAL);
  const socketRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMessage[]>([]);
  const intentRef = useRef<Intent | null>(null);
  const attemptsRef = useRef(0);
  const retryRef = useRef<number | null>(null);
  const closedByUserRef = useRef(false);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    else queueRef.current.push(message);
  }, []);

  const handleMessage = useCallback((message: ServerMessage) => {
    setState((previous) => {
      switch (message.type) {
        case 'joined':
          try {
            sessionStorage.setItem(sessionKey(message.room.code), message.sessionToken);
          } catch {
            /* session storage unavailable: reconnects will create a new seat */
          }
          return { ...previous, room: message.room, playerId: message.playerId, error: null };
        case 'room_update':
          return { ...previous, room: message.room };
        case 'game_started':
          return {
            ...previous,
            room: message.room,
            puzzle: message.puzzle,
            // Anchored locally so a clock skew between device and server cannot distort the timer.
            startedAt: Date.now() - message.elapsedMs,
            error: null,
          };
        case 'game_over':
          return { ...previous, room: message.room };
        case 'error':
          return { ...previous, error: message.code };
        default:
          return previous;
      }
    });
  }, []);

  const connect = useCallback(() => {
    const intent = intentRef.current;
    if (!intent || socketRef.current) return;

    setState((previous) => ({ ...previous, status: 'connecting' }));
    const socket = new WebSocket(socketUrl());
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      attemptsRef.current = 0;
      setState((previous) => ({ ...previous, status: 'open' }));

      const code = intent.code;
      const token = code ? readToken(code) : undefined;
      const entry: ClientMessage =
        intent.kind === 'create' && !code
          ? { type: 'create_room', name: intent.name, difficulty: intent.difficulty }
          : { type: 'join_room', code: code ?? '', name: intent.name, sessionToken: token };
      socket.send(JSON.stringify(entry));

      for (const queued of queueRef.current.splice(0)) socket.send(JSON.stringify(queued));
    });

    socket.addEventListener('message', (event) => {
      try {
        handleMessage(JSON.parse(String(event.data)) as ServerMessage);
      } catch {
        /* ignore malformed frames */
      }
    });

    socket.addEventListener('close', () => {
      socketRef.current = null;
      setState((previous) => ({ ...previous, status: 'closed' }));
      if (closedByUserRef.current || !intentRef.current) return;

      const delay = RECONNECT_DELAYS_MS[Math.min(attemptsRef.current, RECONNECT_DELAYS_MS.length - 1)];
      attemptsRef.current += 1;
      retryRef.current = window.setTimeout(connect, delay);
    });
  }, [handleMessage]);

  useEffect(
    () => () => {
      closedByUserRef.current = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    },
    [],
  );

  const createRoom = useCallback(
    (name: string, difficulty: Difficulty) => {
      closedByUserRef.current = false;
      intentRef.current = { kind: 'create', name, difficulty };
      connect();
    },
    [connect],
  );

  const joinRoom = useCallback(
    (code: string, name: string) => {
      closedByUserRef.current = false;
      intentRef.current = { kind: 'join', name, difficulty: 'medium', code: code.toUpperCase() };
      connect();
    },
    [connect],
  );

  const leave = useCallback(() => {
    closedByUserRef.current = true;
    intentRef.current = null;
    if (retryRef.current) window.clearTimeout(retryRef.current);
    send({ type: 'leave' });
    socketRef.current?.close();
    socketRef.current = null;
    queueRef.current = [];
    setState(INITIAL);
  }, [send]);

  // The room code lands only after the server answers, so the intent is patched then.
  useEffect(() => {
    if (state.room && intentRef.current) intentRef.current.code = state.room.code;
  }, [state.room]);

  return {
    ...state,
    createRoom,
    joinRoom,
    setReady: useCallback((ready: boolean) => send({ type: 'set_ready', ready }), [send]),
    setDifficulty: useCallback((difficulty: Difficulty) => send({ type: 'set_difficulty', difficulty }), [send]),
    startGame: useCallback(() => send({ type: 'start_game' }), [send]),
    reportProgress: useCallback(
      (filledCells: number, mistakes: number) => send({ type: 'progress', filledCells, mistakes }),
      [send],
    ),
    reportEliminated: useCallback(() => send({ type: 'eliminated' }), [send]),
    submitSolution: useCallback((grid: string) => send({ type: 'finish', grid }), [send]),
    leave,
    dismissError: useCallback(() => setState((previous) => ({ ...previous, error: null })), []),
  };
}

function readToken(code: string): string | undefined {
  try {
    return sessionStorage.getItem(sessionKey(code)) ?? undefined;
  } catch {
    return undefined;
  }
}
