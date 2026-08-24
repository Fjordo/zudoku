import { useI18n } from '../../../i18n';

interface GameControlsProps {
  notesMode: boolean;
  hintsLeft: number;
  canUndo: boolean;
  disabled: boolean;
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
}

export function GameControls({
  notesMode,
  hintsLeft,
  canUndo,
  disabled,
  onUndo,
  onErase,
  onToggleNotes,
  onHint,
}: GameControlsProps) {
  const { t } = useI18n();

  return (
    <div className="controls" role="group" aria-label={t('game.actionsLabel')}>
      <button type="button" className="controls__button" disabled={disabled || !canUndo} onClick={onUndo}>
        <span aria-hidden="true">↺</span>
        {t('game.undo')}
      </button>
      <button type="button" className="controls__button" disabled={disabled} onClick={onErase}>
        <span aria-hidden="true">⌫</span>
        {t('game.erase')}
      </button>
      <button
        type="button"
        className="controls__button"
        aria-pressed={notesMode}
        disabled={disabled}
        onClick={onToggleNotes}
      >
        <span aria-hidden="true">✎</span>
        {notesMode ? t('game.notesOn') : t('game.notesOff')}
      </button>
      <button type="button" className="controls__button" disabled={disabled || hintsLeft <= 0} onClick={onHint}>
        <span aria-hidden="true">💡</span>
        {t('game.hint', { count: hintsLeft })}
      </button>
    </div>
  );
}
