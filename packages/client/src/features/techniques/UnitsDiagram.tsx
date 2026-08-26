import { CELL_COUNT, boxOf, colOf, rowOf } from '@zudoku/shared';
import { useI18n } from '../../i18n';

const UNITS = [
  { key: 'row', label: 'techniques.unitRow', holds: (index: number) => rowOf(index) === 3 },
  { key: 'col', label: 'techniques.unitCol', holds: (index: number) => colOf(index) === 6 },
  { key: 'box', label: 'techniques.unitBox', holds: (index: number) => boxOf(index) === 6 },
] as const;

/**
 * The three units, drawn once each. Every rule below is a statement about one
 * of these nine-cell groups, so the reader gets the shapes before the words.
 */
export function UnitsDiagram() {
  const { t } = useI18n();

  return (
    <ul className="units">
      {UNITS.map((unit) => (
        <li key={unit.key} className="units__item">
          <div className="units__grid" role="img" aria-label={t(unit.label)}>
            {Array.from({ length: CELL_COUNT }, (_, index) => (
              <span
                key={index}
                className={`units__cell${unit.holds(index) ? ' units__cell--lit' : ''}`}
              />
            ))}
          </div>
          <span className="units__label">{t(unit.label)}</span>
        </li>
      ))}
    </ul>
  );
}
