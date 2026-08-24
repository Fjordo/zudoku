import { useEffect } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ChallengeGame } from '../features/challenge/components/ChallengeGame';
import { JoinForm } from '../features/challenge/components/JoinForm';
import { Lobby } from '../features/challenge/components/Lobby';
import { useChallengeRoom, type ConnectionStatus } from '../features/challenge/useChallengeRoom';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/en';
import './pages.css';
import '../features/challenge/challenge.css';

interface ChallengePageProps {
  /** Room code from the invite link, if any. */
  code: string | null;
  navigate: (path: string) => void;
}

export function ChallengePage({ code, navigate }: ChallengePageProps) {
  const { t } = useI18n();
  const challenge = useChallengeRoom();
  const { room, playerId, puzzle, startedAt, status, error } = challenge;

  // Keep the address bar in sync so the room link can be shared or reloaded.
  useEffect(() => {
    if (room && room.code !== code) navigate(`/challenge/${room.code}`);
  }, [code, navigate, room]);

  const leave = () => {
    challenge.leave();
    navigate('/');
  };

  if (room && puzzle && startedAt !== null && playerId && room.status !== 'lobby') {
    return (
      <ChallengeGame
        key={puzzle}
        room={room}
        playerId={playerId}
        puzzle={puzzle}
        startedAt={startedAt}
        challenge={challenge}
        onExit={leave}
        onLearnMore={() => navigate('/techniques')}
      />
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="button button--ghost" onClick={leave}>
          {t('common.back')}
        </button>
        <span className="topbar__title">{t('challenge.title')}</span>
        <LanguageSwitcher />
      </header>

      <p className="badge badge--status">{t(connectionKey(status))}</p>

      {error && (
        <div className="notice" role="alert">
          <span>{t(`error.${error}` as MessageKey)}</span>
          <button
            type="button"
            className="button button--ghost small"
            aria-label={t('common.close')}
            onClick={challenge.dismissError}
          >
            ✕
          </button>
        </div>
      )}

      {room && playerId ? (
        <Lobby
          room={room}
          playerId={playerId}
          onSetReady={challenge.setReady}
          onSetDifficulty={challenge.setDifficulty}
          onStart={challenge.startGame}
          onLeave={leave}
        />
      ) : (
        <JoinForm
          initialCode={code}
          busy={status === 'connecting'}
          onCreate={challenge.createRoom}
          onJoin={challenge.joinRoom}
        />
      )}
    </div>
  );
}

const connectionKey = (status: ConnectionStatus): MessageKey => {
  switch (status) {
    case 'open':
      return 'challenge.connectionOpen';
    case 'connecting':
      return 'challenge.connectionConnecting';
    case 'closed':
      return 'challenge.connectionClosed';
    default:
      return 'challenge.connectionIdle';
  }
};
