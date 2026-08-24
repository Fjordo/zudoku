import { CELL_COUNT, DIGITS, SIZE, colOf, rowOf } from '@zudoku/shared';
import type { GuideExample } from './guide';

interface MiniBoardProps {
  example: GuideExample;
  caption: string;
}

/** Small read-only board used to illustrate a technique. */
export function MiniBoard({ example, caption }: MiniBoardProps) {
  const pattern = new Set(example.pattern ?? []);
  const targets = new Set(example.targets ?? []);

  return (
    <figure className="mini">
      <div className="mini__grid" role="img" aria-label={caption}>
        {Array.from({ length: CELL_COUNT }, (_, index) => {
          const digit = example.digits?.[index];
          const notes = example.notes?.[index];
          const className = [
            'mini__cell',
            pattern.has(index) && 'mini__cell--pattern',
            targets.has(index) && 'mini__cell--target',
            colOf(index) % 3 === 2 && colOf(index) !== SIZE - 1 && 'mini__cell--edge-right',
            rowOf(index) % 3 === 2 && rowOf(index) !== SIZE - 1 && 'mini__cell--edge-bottom',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={index} className={className}>
              {digit ? (
                <span className="mini__digit">{digit}</span>
              ) : notes ? (
                <span className="mini__notes">
                  {DIGITS.map((candidate) => (
                    <span key={candidate}>{notes.includes(candidate) ? candidate : ''}</span>
                  ))}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <figcaption className="small muted">{caption}</figcaption>
    </figure>
  );
}
