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
 * A digit placed all nine times leaves the keypad: there is nothing left to
 * enter, and the row that remains is exactly the work that remains.
 */
export function NumberPad({ state, disabled, onInput }: NumberPadProps) {
  const { t } = useI18n();
  const left = DIGITS.map((digit) => [digit, remainingForDigit(state, digit)] as const).filter(
    ([, remaining]) => remaining > 0,
  );

  // The last digit retires with the last cell, so an empty keypad means a
  // finished grid: it leaves rather than sit there as a blank strip.
  if (left.length === 0) return null;

  return (
    <div className="pad" role="group" aria-label={t('game.digitsLabel')}>
      {left.map(([digit, remaining]) => (
        <button
          key={digit}
          type="button"
          className="pad__key"
          aria-label={t('game.digitLabel', { digit })}
          aria-pressed={state.activeDigit === digit}
          disabled={disabled}
          onClick={() => onInput(digit)}
        >
          <span className="pad__digit">{digit}</span>
          <span className="pad__count tabular">{remaining}</span>
        </button>
      ))}
    </div>
  );
}
