/* Runtime test for the pure speed-scaling helper. npx tsx src/hooks/useGameEngine.test.ts */
import { cycleDurationFor } from '@/utils/engine';
import { INITIAL_CYCLE_MS, MIN_CYCLE_MS, SPEED_STEP_EVERY, SPEED_STEP_MS } from '@/constants/game';

let passed = 0, failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) passed++; else { failed++; console.error(`  FAIL: ${msg}`); }
}

assert(cycleDurationFor(0) === INITIAL_CYCLE_MS, '0 placed -> initial cycle');
assert(cycleDurationFor(SPEED_STEP_EVERY - 1) === INITIAL_CYCLE_MS, 'below step -> initial');
assert(cycleDurationFor(SPEED_STEP_EVERY) === INITIAL_CYCLE_MS - SPEED_STEP_MS, 'at step -> one step down');
assert(cycleDurationFor(SPEED_STEP_EVERY * 2) === INITIAL_CYCLE_MS - 2 * SPEED_STEP_MS, 'two steps down');
// Floor at MIN_CYCLE_MS
const manySteps = Math.ceil((INITIAL_CYCLE_MS - MIN_CYCLE_MS) / SPEED_STEP_MS) * SPEED_STEP_EVERY + 1;
assert(cycleDurationFor(manySteps) === MIN_CYCLE_MS, 'clamps at MIN_CYCLE_MS');
assert(cycleDurationFor(manySteps + 100) === MIN_CYCLE_MS, 'stays at floor');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
