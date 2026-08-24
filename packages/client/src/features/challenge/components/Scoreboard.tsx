import { CELL_COUNT, type PlayerSnapshot, type RoomSnapshot } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import type { I18n } from '../../../i18n';
import { formatDuration } from '../../../lib/format';

interface ScoreboardProps {
  room: RoomSnapshot;
  playerId: string;
}

/** Live standings: finished players first, then whoever has filled more cells. */
export function Scoreboard({ room, playerId }: ScoreboardProps) {
  const { t } = useI18n();
  const players = [...room.players].sort(compare);

  return (
    <div className="card stack">
      <h2 className="section-title">{t('challenge.standings')}</h2>
      <ul className="players">
        {players.map((player) => (
          <li key={player.id} className="players__row players__row--stacked">
            <div className="players__line">
              <span className="players__name">
                {player.name}
                {player.id === playerId && <span className="badge">{t('common.you')}</span>}
                {room.winnerId === player.id && <span className="badge badge--win">{t('challenge.winner')}</span>}
              </span>
              <span className="small tabular">{describe(player, t)}</span>
            </div>
            <div className="progress" role="presentation">
              <span
                className={player.status === 'eliminated' ? 'progress__bar progress__bar--out' : 'progress__bar'}
                style={{ width: `${Math.round((player.filledCells / CELL_COUNT) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function describe(player: PlayerSnapshot, t: I18n['t']): string {
  if (player.status === 'finished' && player.finishTimeMs !== null) {
    return t('challenge.rank', { rank: player.rank ?? 1, time: formatDuration(player.finishTimeMs) });
  }
  if (player.status === 'eliminated') return t('challenge.out');
  if (!player.connected) return t('challenge.offline');
  return t('challenge.progress', { filled: player.filledCells, mistakes: player.mistakes });
}

function compare(a: PlayerSnapshot, b: PlayerSnapshot): number {
  const rank = (player: PlayerSnapshot) => (player.status === 'finished' ? 0 : player.status === 'playing' ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (a.status === 'finished' && b.status === 'finished') {
    return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
  }
  return b.filledCells - a.filledCells;
}
