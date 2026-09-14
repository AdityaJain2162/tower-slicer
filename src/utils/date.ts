/**
 * Date helpers for daily-streak tracking.
 *
 * Pure functions, no RN dependency, so they can be unit-tested in plain Node.
 * All dates are normalized to the local day (YYYY-MM-DD) so streaks are
 * counted by calendar day, not by 24-hour windows.
 */

/** Format a Date as a local YYYY-MM-DD string (no timezone shift). */
export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's local YYYY-MM-DD key. */
export function todayKey(): string {
  return toDayKey(new Date());
}

/** Parse a YYYY-MM-DD key back into a local Date at midnight. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Difference in whole calendar days between two YYYY-MM-DD keys. */
export function dayDiff(aKey: string, bKey: string): number {
  const a = fromDayKey(aKey).getTime();
  const b = fromDayKey(bKey).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Compute the new daily streak given the previous streak + last-played date.
 *
 * - Same day as last play: streak unchanged (don't double-count a day).
 * - Yesterday (diff === 1): streak increments by 1.
 * - More than one day gap (diff > 1): streak resets to 1.
 * - No previous play (lastPlayed null): streak starts at 1.
 */
export function nextDailyStreak(
  prevStreak: number,
  lastPlayed: string | null,
  today: string = todayKey(),
): number {
  if (!lastPlayed) return 1;
  const diff = dayDiff(lastPlayed, today);
  if (diff === 0) return prevStreak; // already played today
  if (diff === 1) return prevStreak + 1; // consecutive day
  return 1; // streak broken
}
