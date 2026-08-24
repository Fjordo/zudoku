import {
  isDifficulty,
  isValidRoomCode,
  sanitizePlayerName,
  type ClientMessage,
} from '@zudoku/shared';

/** Parses untrusted client input into a `ClientMessage`, or null when malformed. */
export function parseClientMessage(raw: string): ClientMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const message = data as Record<string, unknown>;
  switch (message.type) {
    case 'create_room': {
      const name = readName(message.name);
      return name && isDifficulty(message.difficulty)
        ? { type: 'create_room', name, difficulty: message.difficulty }
        : null;
    }
    case 'join_room': {
      const name = readName(message.name);
      const code = typeof message.code === 'string' ? message.code : '';
      if (!name || !isValidRoomCode(code)) return null;
      const sessionToken = typeof message.sessionToken === 'string' ? message.sessionToken : undefined;
      return { type: 'join_room', code, name, sessionToken };
    }
    case 'set_ready':
      return typeof message.ready === 'boolean' ? { type: 'set_ready', ready: message.ready } : null;
    case 'set_difficulty':
      return isDifficulty(message.difficulty)
        ? { type: 'set_difficulty', difficulty: message.difficulty }
        : null;
    case 'progress':
      return typeof message.filledCells === 'number' && typeof message.mistakes === 'number'
        ? { type: 'progress', filledCells: message.filledCells, mistakes: message.mistakes }
        : null;
    case 'finish':
      return typeof message.grid === 'string' && message.grid.length === 81
        ? { type: 'finish', grid: message.grid }
        : null;
    case 'start_game':
    case 'eliminated':
    case 'leave':
    case 'ping':
      return { type: message.type };
    default:
      return null;
  }
}

function readName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = sanitizePlayerName(value);
  return name.length > 0 ? name : null;
}
