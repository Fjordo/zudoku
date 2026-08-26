import { DIGITS, colOf, indexOf, rowOf } from '@zudoku/shared';
import { useI18n } from '../../i18n';
import type { GuideExample } from './guide';

interface MiniBoardProps {
  example: GuideExample;
  caption: string;
}

/**
 * The diagram that carries a technique.
 *
 * It shows a crop of the board rather than all 81 cells, because the cell has
 * to be big enough to hold a readable candidate list on a phone. A three-column
 * crop gives cells roughly three times the size of a full grid; the wide crops
 * fall back to `scan` mode, where each cell only answers "does this digit still
 * fit here?" and so needs one glyph instead of nine.
 */
export function MiniBoard({ example, caption }: MiniBoardProps) {
  const { t } = useI18n();
  const { view, mode } = example;

  const pattern = new Set(example.pattern ?? []);
  const targets = new Set(example.targets ?? []);
  const cause = new Set(example.cause ?? []);
  const marks = new Set(example.marks ?? []);
  const ruled = new Set(example.ruled ?? []);
  const focus = new Set(example.focus ?? []);
  const bandRows = new Set(example.bands?.rows ?? []);
  const bandCols = new Set(example.bands?.cols ?? []);

  const rows = Array.from({ length: view.rows }, (_, i) => view.row + i);
  const cols = Array.from({ length: view.cols }, (_, i) => view.col + i);

  return (
    <figure className="diagram">
      <div
        className={`diagram__grid diagram__grid--${mode}`}
        style={
          {
            // The ruler gutter first, then one equal track per column of the crop.
            gridTemplateColumns: `auto repeat(${view.cols}, minmax(0, 1fr))`,
            '--cols': view.cols,
          } as React.CSSProperties
        }
        role="img"
        aria-label={caption}
      >
        <span className="diagram__corner" aria-hidden="true" />
        {cols.map((col) => (
          <span
            key={`c${col}`}
            className={`diagram__ruler${bandCols.has(col) ? ' diagram__ruler--lit' : ''}`}
            aria-hidden="true"
          >
            {col + 1}
          </span>
        ))}

        {rows.map((row) => (
          <Row
            key={`r${row}`}
            row={row}
            cols={cols}
            lit={bandRows.has(row)}
            render={(index) => {
              const digit = example.digits?.[index];
              const notes = example.notes?.[index];
              const cuts = example.cuts?.[index] ?? [];

              const className = [
                'diagram__cell',
                pattern.has(index) && 'diagram__cell--pattern',
                targets.has(index) && 'diagram__cell--target',
                cause.has(index) && 'diagram__cell--cause',
                (bandRows.has(row) || bandCols.has(colOf(index))) && 'diagram__cell--band',
                colOf(index) % 3 === 2 && colOf(index) !== cols[cols.length - 1] && 'diagram__cell--edge-right',
                rowOf(index) % 3 === 2 && rowOf(index) !== rows[rows.length - 1] && 'diagram__cell--edge-bottom',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={index} className={className}>
                  {digit ? (
                    <span className="diagram__digit">{digit}</span>
                  ) : mode === 'scan' ? (
                    <ScanCell index={index} focus={example.focus?.[0]} marks={marks} ruled={ruled} />
                  ) : notes ? (
                    <span className="diagram__notes">
                      {DIGITS.map((candidate) => {
                        const present = notes.includes(candidate);
                        const cut = cuts.includes(candidate);
                        const noteClass = [
                          'diagram__note',
                          present && focus.has(candidate) && !cut && 'diagram__note--focus',
                          cut && 'diagram__note--cut',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <span key={candidate} className={noteClass}>
                            {present ? candidate : ''}
                          </span>
                        );
                      })}
                    </span>
                  ) : null}
                </div>
              );
            }}
          />
        ))}
      </div>

      {/* How to read it, then what it means: the convention has to land first. */}
      <p className="diagram__reading small muted">
        {t(mode === 'scan' ? 'techniques.readScan' : 'techniques.readNotes')}
      </p>
      <Legend example={example} />
      <figcaption className="diagram__caption">{caption}</figcaption>
    </figure>
  );
}

interface RowProps {
  row: number;
  cols: number[];
  lit: boolean;
  render: (index: number) => React.ReactNode;
}

function Row({ row, cols, lit, render }: RowProps) {
  return (
    <>
      <span className={`diagram__ruler${lit ? ' diagram__ruler--lit' : ''}`} aria-hidden="true">
        {row + 1}
      </span>
      {cols.map((col) => render(indexOf(row, col)))}
    </>
  );
}

interface ScanCellProps {
  index: number;
  focus: number | undefined;
  marks: Set<number>;
  ruled: Set<number>;
}

/** In scan mode a cell says one thing only: can the digit still go here? */
function ScanCell({ index, focus, marks, ruled }: ScanCellProps) {
  if (marks.has(index)) return <span className="diagram__mark">{focus}</span>;
  if (ruled.has(index)) return <span className="diagram__mark diagram__mark--ruled">{focus}</span>;
  return null;
}

/** Only the roles this diagram actually uses get a chip. */
function Legend({ example }: { example: GuideExample }) {
  const { t } = useI18n();
  const scan = example.mode === 'scan';

  const chips = [
    example.pattern?.length && {
      key: 'pattern',
      label: t(scan ? 'techniques.legendFits' : 'techniques.legendPattern'),
    },
    example.targets?.length && {
      key: 'target',
      label: t(scan ? 'techniques.legendGone' : 'techniques.legendTarget'),
    },
    example.cause?.length && { key: 'cause', label: t('techniques.legendCause') },
    !scan && example.focus?.length && { key: 'focus', label: t('techniques.legendFocus') },
    !scan && example.cuts && { key: 'cut', label: t('techniques.legendCut') },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <ul className="diagram__legend">
      {chips.map((chip) => (
        <li key={chip.key} className="diagram__key">
          <span className={`diagram__swatch diagram__swatch--${chip.key}`} aria-hidden="true" />
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
