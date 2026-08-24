import { useState, type FormEvent } from 'react';
import {
  DIFFICULTIES,
  MAX_NAME_LENGTH,
  ROOM_CODE_LENGTH,
  isValidRoomCode,
  sanitizePlayerName,
  type Difficulty,
} from '@zudoku/shared';
import { useI18n } from '../../../i18n';
import type { MessageKey } from '../../../i18n/en';

interface JoinFormProps {
  /** Prefilled when the player followed an invite link. */
  initialCode: string | null;
  busy: boolean;
  onCreate: (name: string, difficulty: Difficulty) => void;
  onJoin: (code: string, name: string) => void;
}

const NAME_KEY = 'zudoku.name';

export function JoinForm({ initialCode, busy, onCreate, onJoin }: JoinFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(() => readName());
  const [code, setCode] = useState(initialCode ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const cleanName = sanitizePlayerName(name);
  const canSubmit = cleanName.length > 0 && !busy;

  const remember = () => {
    try {
      localStorage.setItem(NAME_KEY, cleanName);
    } catch {
      /* storage unavailable: the name is simply not remembered */
    }
  };

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !isValidRoomCode(code)) return;
    remember();
    onJoin(code, cleanName);
  };

  const submitCreate = () => {
    if (!canSubmit) return;
    remember();
    onCreate(cleanName, difficulty);
  };

  return (
    <div className="stack">
      <div className="card stack">
        <label className="field">
          <span className="field__label">{t('challenge.yourName')}</span>
          <input
            className="input"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('challenge.namePlaceholder')}
            autoComplete="nickname"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      </div>

      <div className="card stack">
        <h2 className="section-title">{t('challenge.createTitle')}</h2>
        <div className="field">
          <span className="field__label">{t('home.difficulty')}</span>
          <div className="segmented">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                className="segmented__option"
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
              >
                {t(`difficulty.${level}` as MessageKey)}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="button button--primary button--block"
          disabled={!canSubmit}
          onClick={submitCreate}
        >
          {t('challenge.createCta')}
        </button>
      </div>

      <form className="card stack" onSubmit={submitJoin}>
        <h2 className="section-title">{t('challenge.joinTitle')}</h2>
        <label className="field">
          <span className="field__label">{t('challenge.inviteCode')}</span>
          <input
            className="input code-input"
            value={code}
            maxLength={ROOM_CODE_LENGTH}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </label>
        <button type="submit" className="button button--block" disabled={!canSubmit || !isValidRoomCode(code)}>
          {t('challenge.joinCta')}
        </button>
      </form>
    </div>
  );
}

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}
