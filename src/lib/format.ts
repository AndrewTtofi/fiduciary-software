/** Returns the number of whole days between `date` and now (always >= 0). */
export function daysAgo(date: Date | string): number {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** "X ago" label — e.g. "12d ago", "today" */
export function formatDaysAgo(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

/** Given the risk rating, return the screening cadence in days. */
export function cadenceDays(rating: string | null): number {
  if (rating === "high") return 30;
  if (rating === "standard") return 90;
  return 365; // low or unknown
}
