import { cellName, type TechniqueId, type UnitRef } from '@zudoku/shared';
import type { MessageKey } from '../../i18n/en';
import type { I18n } from '../../i18n';
import type { HintInfo } from './gameState';

export interface RenderedHint {
  message: string;
  technique: TechniqueId | null;
}

/** Turns a structured hint into a sentence in the active language. */
export function renderHint(hint: HintInfo, t: I18n['t']): RenderedHint {
  if (hint.kind === 'none') return { message: t('hint.none'), technique: null };

  const { step } = hint;
  // XY-Wing names three digits and the eliminated one is the last.
  const digit = step.technique === 'xy_wing' ? step.digits[2] : step.digits[0];
  return {
    message: t(`hint.${step.technique}` as MessageKey, {
      cell: cellName(step.cells[0] ?? 0),
      cells: step.cells.map(cellName).join(', '),
      digit: digit ?? '',
      digits: step.digits.join('/'),
      unit: unitLabel(step.unit, t),
    }),
    technique: step.technique,
  };
}

export const unitLabel = (unit: UnitRef | null, t: I18n['t']): string =>
  unit ? t(`unit.${unit.kind}` as MessageKey, { position: unit.position + 1 }) : '';

export const techniqueLabel = (technique: TechniqueId, t: I18n['t']): string =>
  t(`technique.${technique}` as MessageKey);
