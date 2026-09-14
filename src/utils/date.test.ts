/* Runtime test harness for the date/streak helpers.
 * Run: npx tsx --tsconfig tsconfig.json src/utils/date.test.ts
 */
import { toDayKey, fromDayKey, dayDiff, nextDailyStreak } from '@/utils/date';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) passed++; else { failed++; console.error(`  FAIL: ${msg}`); }
}

// 1. toDayKey formats correctly (zero-padded)
assert(toDayKey(new Date(2024, 0, 5)) === '2024-01-05', 'toDayKey pads month+day');
assert(toDayKey(new Date(2024, 10, 25)) === '2024-11-25', 'toDayKey two-digit month');

// 2. fromDayKey round-trips
{
  const d = fromDayKey('2024-03-15');
  assert(d.getFullYear() === 2024, 'fromDayKey year');
  assert(d.getMonth() === 2, 'fromDayKey month (0-indexed)');
  assert(d.getDate() === 15, 'fromDayKey day');
}

// 3. dayDiff: consecutive days
assert(dayDiff('2024-01-01', '2024-01-02') === 1, 'dayDiff 1');
assert(dayDiff('2024-01-01', '2024-01-01') === 0, 'dayDiff same day = 0');
assert(dayDiff('2024-01-01', '2024-01-31') === 30, 'dayDiff 30');
assert(dayDiff('2024-01-31', '2024-01-01') === -30, 'dayDiff negative');

// 4. dayDiff across month boundary
assert(dayDiff('2024-01-31', '2024-02-01') === 1, 'dayDiff across month');

// 5. nextDailyStreak: no previous play -> starts at 1
assert(nextDailyStreak(0, null, '2024-01-01') === 1, 'first play -> 1');

// 6. nextDailyStreak: same day -> unchanged
assert(nextDailyStreak(3, '2024-01-01', '2024-01-01') === 3, 'same day -> unchanged');

// 7. nextDailyStreak: yesterday -> +1
assert(nextDailyStreak(3, '2024-01-01', '2024-01-02') === 4, 'yesterday -> +1');

// 8. nextDailyStreak: gap of 2 days -> reset to 1
assert(nextDailyStreak(5, '2024-01-01', '2024-01-03') === 1, 'gap -> reset to 1');

// 9. nextDailyStreak: gap of 30 days -> reset to 1
assert(nextDailyStreak(10, '2024-01-01', '2024-01-31') === 1, 'big gap -> reset');

// 10. nextDailyStreak: streak 0 + yesterday -> 1 (not 0+1=1, but explicit)
assert(nextDailyStreak(0, '2024-01-01', '2024-01-02') === 1, 'zero streak + yesterday -> 1');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
