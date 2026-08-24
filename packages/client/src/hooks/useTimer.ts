import { useEffect, useState } from 'react';

/** Elapsed milliseconds since `startedAt`, ticking while `running` is true. */
export function useTimer(startedAt: number | null, running: boolean, tickMs = 250): number {
  const [elapsed, setElapsed] = useState(() => (startedAt === null ? 0 : Date.now() - startedAt));

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - startedAt);
    if (!running) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), tickMs);
    return () => window.clearInterval(id);
  }, [running, startedAt, tickMs]);

  return elapsed;
}
