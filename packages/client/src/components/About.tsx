import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

/**
 * The colophon, opened from a quiet `?` in the header.
 *
 * It is printed on porcelain because that is where printed matter lives in this
 * app — the clues, the rules, the plate itself. A backstamp is what a piece of
 * porcelain carries on its underside: who made it, which pattern, which year.
 * The card says exactly that and nothing more, so it stays a mark rather than
 * a screen.
 */
export function About() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="about__trigger"
        aria-label={t('about.open')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {open && (
        <AboutDialog
          onClose={() => {
            setOpen(false);
            // The header must not lose the caret when the card goes away.
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    // Capture so the card closes before a running board reads the key.
    window.addEventListener('keydown', onKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="about__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('about.open')}
      // Anywhere off the card dismisses it; the card itself swallows the click.
      onClick={onClose}
    >
      <div className="about__panel" onClick={(event) => event.stopPropagation()}>
        <div className="about__plate">
          <p className="about__wordmark">Zudoku</p>
          <p className="about__maker">{t('about.maker')}</p>
          <hr className="about__rule" />
          <p className="about__version tabular">{t('about.version', { version: __APP_VERSION__ })}</p>
          <p className="about__fineprint">{t('about.fineprint')}</p>
        </div>
        <button ref={closeRef} type="button" className="button button--ghost" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
