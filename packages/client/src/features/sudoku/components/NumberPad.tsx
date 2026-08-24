import { DIGITS } from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import { remainingForDigit, type GameState } from '../gameState';

interface NumberPadProps {
  state: GameState;
  disabled: boolean;
  onInput: (digit: number) => void;
}

/**
 * Tapping a digit enters it in the selected cell and always makes it the
 * highlighted digit, so its rows and columns light up across the board.
 * Digits already placed nine times stay tappable: highlighting them is useful
 * even when there is nothing left to enter.
 */
export function NumberPad({ state, disabled, onInput }: NumberPadProps) {
  const { t } = useI18n();

  return (
    <div className="pad" role="group" aria-label={t('game.digitsLabel')}>
      {DIGITS.map((digit) => {
        const left = remainingForDigit(state, digit);
        return (
          <button
            key={digit}
            type="button"
            className={left > 0 ? 'pad__key' : 'pad__key pad__key--done'}
            aria-label={t('game.digitLabel', { digit })}
            aria-pressed={state.activeDigit === digit}
            disabled={disabled}
            onClick={() => onInput(digit)}
          >
            <span className="pad__digit">{digit}</span>
            <span className="pad__count tabular">{left > 0 ? left : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
