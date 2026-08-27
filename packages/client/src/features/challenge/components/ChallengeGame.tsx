import { useEffect, useMemo, useRef } from 'react';
import {
  DIFFICULTY_PROFILES,
  gridToString,
  parseGrid,
  solve,
  type RoomSnapshot,
} from '@zudoku/shared';
import { useTimer } from '../../../hooks/useTimer';
import { useI18n } from '../../../i18n';
import { formatDuration } from '../../../lib/format';
import { GameScreen } from '../../sudoku/components/GameScreen';
import { filledCount } from '../../sudoku/gameState';
import { useSudokuGame } from '../../sudoku/useSudokuGame';
import type { ChallengeApi } from '../useChallengeRoom';
import { LinkLost } from './LinkLost';
import { Scoreboard } from './Scoreboard';

interface ChallengeGameProps {
  room: RoomSnapshot;
  playerId: string;
  puzzle: string;
  startedAt: number;
  challenge: ChallengeApi;
  onExit: () => void;
}

/** The race itself: same rules as solo, with progress mirrored to the room. */
export function ChallengeGame({
  room,
  playerId,
  puzzle,
  startedAt,
  challenge,
  onExit,
}: ChallengeGameProps) {
  const { t } = useI18n();

  // The puzzle has a single solution, so the client derives it instead of trusting the wire.
  const solution = useMemo(() => {
    const solved = solve(parseGrid(puzzle)).solution;
    if (!solved) throw new Error('Received an unsolvable puzzle');
    return gridToString(solved);
  }, [puzzle]);

  const setup = useMemo(
    () => ({ puzzle, solution, hints: DIFFICULTY_PROFILES[room.difficulty].hints }),
    [puzzle, room.difficulty, solution],
  );
  const game = useSudokuGame(setup);
  const { state } = game;

  // These callbacks are stable, so effects can depend on them safely.
  const { reportProgress, submitSolution, reportEliminated, startGame } = challenge;

  const me = room.players.find((player) => player.id === playerId);
  const racing = state.status === 'playing' && me?.status === 'playing';
  const elapsedMs = useTimer(startedAt, racing);

  const filled = filledCount(state);
  useEffect(() => {
    if (state.status === 'playing') reportProgress(filled, state.mistakes);
  }, [filled, reportProgress, state.mistakes, state.status]);

  const reportedRef = useRef(false);
  useEffect(() => {
    if (reportedRef.current || state.status === 'playing') return;
    reportedRef.current = true;
    if (state.status === 'won') submitSolution(gridToString(state.cells));
    else reportEliminated();
  }, [reportEliminated, state.cells, state.status, submitSolution]);

  const overlay =
    me && me.status !== 'playing' ? (
      <RaceResult
        room={room}
        playerId={playerId}
        canRestart={room.hostId === playerId && room.status === 'finished'}
        onRestart={startGame}
      />
    ) : null;

  return (
    <>
      <GameScreen
        mode="challenge"
        game={game}
        difficulty={room.difficulty}
        elapsedMs={elapsedMs}
        title={t('game.room', { code: room.code })}
        onExit={onExit}
        locked={!racing}
        overlay={overlay}
        aside={<Scoreboard room={room} playerId={playerId} />}
      />
      {/* Only while the race is on: a dropped link after the finish costs nothing. */}
      {racing && <LinkLost status={challenge.status} onLeave={onExit} />}
    </>
  );
}

interface RaceResultProps {
  room: RoomSnapshot;
  playerId: string;
  /** The host can launch a rematch once everyone is done. */
  canRestart: boolean;
  onRestart: () => void;
}

function RaceResult({ room, playerId, canRestart, onRestart }: RaceResultProps) {
  const { t } = useI18n();
  const me = room.players.find((player) => player.id === playerId);
  const winner = room.players.find((player) => player.id === room.winnerId);
  const won = room.winnerId === playerId;

  return (
    <div className="overlay">
      <span className="overlay__title">
        {won
          ? t('challenge.resultWin')
          : me?.status === 'eliminated'
            ? t('challenge.resultOut')
            : t('challenge.resultFinished')}
      </span>
      <p className="muted">
        {me?.status === 'finished' && me.finishTimeMs !== null
          ? t('challenge.resultTime', { time: formatDuration(me.finishTimeMs), rank: me.rank ?? 1 })
          : t('challenge.resultEliminated')}
      </p>
      {!won && winner && <p className="muted small">{t('challenge.resultWinner', { name: winner.name })}</p>}
      {room.status !== 'finished' ? (
        <p className="small muted">{t('challenge.resultWaiting')}</p>
      ) : canRestart ? (
        <button type="button" className="button button--primary" onClick={onRestart}>
          {t('challenge.rematch')}
        </button>
      ) : (
        <p className="small muted">{t('challenge.rematchHost')}</p>
      )}
    </div>
  );
}
