import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n';
import { TechniquesGuide } from './TechniquesGuide';
import './techniques.css';

interface TechniquesDialogProps {
  onClose: () => void;
}

/**
 * The guide as a sheet over the current screen. A running game — above all a
 * challenge, which cannot be rejoined — must never be unmounted to read the
 * rules, so this never navigates away.
 */
export function TechniquesDialog({ onClose }: TechniquesDialogProps) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    // Capture so the sheet closes before anything below reacts to the key.
    window.addEventListener('keydown', onKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('techniques.title')}>
      <div className="sheet__scroll">
        <div className="page">
          <header className="topbar topbar--end">
            <button ref={closeRef} type="button" className="button button--ghost" onClick={onClose}>
              {t('common.close')}
            </button>
          </header>
          <TechniquesGuide />
        </div>
      </div>
    </div>
  );
}
