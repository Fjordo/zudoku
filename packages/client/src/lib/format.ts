/** Formats milliseconds as mm:ss, or h:mm:ss past an hour. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export const ordinal = (rank: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;
  return `${rank}${suffixes[(value - 20) % 10] ?? suffixes[value] ?? suffixes[0]}`;
};
