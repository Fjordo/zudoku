import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../i18n';
import type { ConnectionStatus } from '../useChallengeRoom';

interface LinkLostProps {
  status: ConnectionStatus;
  onLeave: () => void;
}

/** Short blips reconnect on their own, so the card waits before interrupting a race. */
const GRACE_MS = 2500;
/** How long the card stays to confirm the link is back. */
const BACK_MS = 1600;

type Phase = 'quiet' | 'lost' | 'back';

/**
 * The card says what a dropped link costs, not what to press: the socket
 * retries by itself and moves made meanwhile are queued, so the answer to
 * "what now?" is "keep playing". It closes itself the moment the link returns.
 */
export function LinkLost({ status, onLeave }: LinkLostProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('quiet');
  const dismissedRef = useRef(false);
  const graceRef = useRef<number | null>(null);
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === 'open') {
      if (graceRef.current) window.clearTimeout(graceRef.current);
      graceRef.current = null;
      dismissedRef.current = false;
      setPhase((previous) => (previous === 'lost' ? 'back' : 'quiet'));
      return;
    }
    // A retry flips between 'connecting' and 'closed'; the link is down either
    // way, so the grace period runs once for the whole outage.
    if (graceRef.current !== null || dismissedRef.current || phase === 'lost') return;
    graceRef.current = window.setTimeout(() => {
      graceRef.current = null;
      setPhase('lost');
    }, GRACE_MS);
  }, [phase, status]);

  useEffect(() => () => window.clearTimeout(graceRef.current ?? undefined), []);

  useEffect(() => {
    if (phase !== 'back') return;
    const id = window.setTimeout(() => setPhase('quiet'), BACK_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const dismiss = () => {
    dismissedRef.current = true;
    setPhase('quiet');
  };

  useEffect(() => {
    if (phase !== 'lost') return;
    stayRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismiss();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [phase]);

  if (phase === 'quiet') return null;

  return (
    <div
      className={`drop drop--${phase}`}
      role={phase === 'lost' ? 'dialog' : 'status'}
      aria-live="polite"
      aria-labelledby="drop-title"
    >
      <div className="drop__head">
        <span className="drop__lamp" aria-hidden="true" />
        <strong id="drop-title" className="drop__title">
          {t(phase === 'back' ? 'challenge.dropBack' : 'challenge.dropTitle')}
        </strong>
      </div>

      {phase === 'lost' && (
        <>
          <p className="small muted">{t('challenge.dropBody')}</p>
          <p className="small muted">{t('challenge.dropClock')}</p>
          <div className="drop__actions">
            <button ref={stayRef} type="button" className="button button--primary" onClick={dismiss}>
              {t('challenge.dropStay')}
            </button>
            <button type="button" className="button button--ghost" onClick={onLeave}>
              {t('challenge.dropLeave')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
