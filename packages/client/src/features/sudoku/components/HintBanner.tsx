import { useI18n } from '../../../i18n';
import type { HintInfo } from '../gameState';
import { renderHint, techniqueLabel } from '../hintText';

interface HintBannerProps {
  hint: HintInfo;
  onDismiss: () => void;
  onLearnMore: () => void;
}

/** Explains the technique behind the last hint instead of just revealing a digit. */
export function HintBanner({ hint, onDismiss, onLearnMore }: HintBannerProps) {
  const { t } = useI18n();
  const { message, technique } = renderHint(hint, t);

  return (
    <div className="hint" role="status">
      <div className="hint__body">
        {technique && <span className="hint__tag">{techniqueLabel(technique, t)}</span>}
        <p className="small">{message}</p>
      </div>
      <div className="hint__actions">
        {technique && (
          <button type="button" className="button button--ghost small" onClick={onLearnMore}>
            {t('game.hintLearn')}
          </button>
        )}
        <button
          type="button"
          className="button button--ghost small"
          onClick={onDismiss}
          aria-label={t('game.hintDismiss')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
