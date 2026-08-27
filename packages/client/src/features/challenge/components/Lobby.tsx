import { useState } from 'react';
import { DIFFICULTIES, type Difficulty, type RoomSnapshot } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import type { MessageKey } from '../../../i18n/en';

interface LobbyProps {
  room: RoomSnapshot;
  playerId: string;
  onSetReady: (ready: boolean) => void;
  onSetDifficulty: (difficulty: Difficulty) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({ room, playerId, onSetReady, onSetDifficulty, onStart, onLeave }: LobbyProps) {
  const { t } = useI18n();
  const me = room.players.find((player) => player.id === playerId);
  const isHost = room.hostId === playerId;
  const others = room.players.filter((player) => player.id !== playerId);
  const everyoneReady = others.every((player) => player.ready);

  return (
    <div className="stack">
      <InviteCard code={room.code} />

      <div className="card stack">
        <h2 className="section-title">{t('challenge.players', { count: room.players.length })}</h2>
        <ul className="players">
          {room.players.map((player) => (
            <li key={player.id} className="players__row">
              <span className="players__name">
                {player.name}
                {player.isHost && <span className="badge">{t('challenge.host')}</span>}
                {!player.connected && <span className="badge">{t('challenge.disconnected')}</span>}
              </span>
              <span className={player.ready || player.isHost ? 'players__ready' : 'muted small'}>
                {player.isHost || player.ready ? t('challenge.ready') : t('challenge.waiting')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card stack">
        {isHost ? (
          <>
            <div className="field">
              <span className="field__label">{t('home.difficulty')}</span>
              <div className="segmented">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="segmented__option"
                    aria-pressed={room.difficulty === level}
                    onClick={() => onSetDifficulty(level)}
                  >
                    {t(`difficulty.${level}` as MessageKey)}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="button button--primary button--block" onClick={onStart}>
              {t('challenge.start')}
            </button>
            {others.length === 0 ? (
              <p className="small muted">{t('challenge.shareHint')}</p>
            ) : (
              !everyoneReady && <p className="small muted">{t('challenge.someNotReady')}</p>
            )}
          </>
        ) : (
          <>
            <p className="small muted">
              {t('challenge.hostStarts', {
                difficulty: t(`difficulty.${room.difficulty}` as MessageKey),
              })}
            </p>
            <button
              type="button"
              className="button button--primary button--block"
              aria-pressed={me?.ready ?? false}
              onClick={() => onSetReady(!me?.ready)}
            >
              {me?.ready ? t('challenge.imNotReady') : t('challenge.imReady')}
            </button>
          </>
        )}
        <button type="button" className="button button--ghost button--block" onClick={onLeave}>
          {t('challenge.leave')}
        </button>
      </div>
    </div>
  );
}

function InviteCard({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);
  const link = `${window.location.origin}/#/challenge/${code}`;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const share = async () => {
    if (!navigator.share) return copy(link, 'link');
    try {
      await navigator.share({ title: t('challenge.shareTitle'), text: t('challenge.shareText', { code }), url: link });
    } catch {
      /* the share sheet was dismissed */
    }
  };

  return (
    <div className="card stack invite">
      <span className="field__label">{t('challenge.inviteCode')}</span>
      <strong className="invite__code">{code}</strong>
      <div className="row invite__actions">
        <button type="button" className="button" onClick={() => copy(code, 'code')}>
          {copied === 'code' ? t('challenge.copied') : t('challenge.copyCode')}
        </button>
        <button type="button" className="button" onClick={() => copy(link, 'link')}>
          {copied === 'link' ? t('challenge.copied') : t('challenge.copyLink')}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button type="button" className="button" onClick={share}>
            {t('challenge.share')}
          </button>
        )}
      </div>
    </div>
  );
}
