import { describe, expect, it } from 'vitest';
import { parseClientMessage } from './parseMessage.js';

const encode = (value: unknown): string => JSON.stringify(value);

describe('parseClientMessage', () => {
  it('accepts well-formed messages', () => {
    expect(parseClientMessage(encode({ type: 'create_room', name: 'Ada', difficulty: 'hard' }))).toEqual({
      type: 'create_room',
      name: 'Ada',
      difficulty: 'hard',
    });
    expect(parseClientMessage(encode({ type: 'join_room', code: 'abc234', name: ' Ada  Byron ' }))).toEqual({
      type: 'join_room',
      code: 'abc234',
      name: 'Ada Byron',
      sessionToken: undefined,
    });
    expect(parseClientMessage(encode({ type: 'start_game' }))).toEqual({ type: 'start_game' });
  });

  it('rejects malformed or unknown input', () => {
    expect(parseClientMessage('not json')).toBeNull();
    expect(parseClientMessage(encode(null))).toBeNull();
    expect(parseClientMessage(encode({ type: 'nope' }))).toBeNull();
    expect(parseClientMessage(encode({ type: 'create_room', name: '  ', difficulty: 'easy' }))).toBeNull();
    expect(parseClientMessage(encode({ type: 'create_room', name: 'Ada', difficulty: 'insane' }))).toBeNull();
    expect(parseClientMessage(encode({ type: 'join_room', code: '!!!', name: 'Ada' }))).toBeNull();
    expect(parseClientMessage(encode({ type: 'finish', grid: '123' }))).toBeNull();
    expect(parseClientMessage(encode({ type: 'progress', filledCells: '10', mistakes: 0 }))).toBeNull();
  });

  it('truncates overlong names', () => {
    const message = parseClientMessage(encode({ type: 'create_room', name: 'x'.repeat(50), difficulty: 'easy' }));
    expect(message).toMatchObject({ type: 'create_room' });
    expect((message as { name: string }).name).toHaveLength(20);
  });
});
