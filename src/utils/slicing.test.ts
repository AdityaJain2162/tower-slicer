/* Lightweight runtime test harness for the slicing math (no test runner dep).
 * Run with: npx tsx src/utils/slicing.test.ts
 */
import { BLOCK_HEIGHT } from '@/constants/game';
import { computeOverlap, resolveTap } from '@/utils/slicing';
import type { PlacedBlock } from '@/types';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function makePrev(x: number, width: number, layer = 0): PlacedBlock {
  return { id: 0, layer, x, width, height: BLOCK_HEIGHT, color: '#000' };
}

// 1. computeOverlap: full overlap
{
  const prev = makePrev(0, 100);
  const r = computeOverlap(0, 100, prev);
  assert(r.overlapWidth === 100, 'full overlap width=100');
  assert(r.leftEdge === 0 && r.rightEdge === 100, 'full overlap edges');
}

// 2. computeOverlap: partial right overshoot
{
  const prev = makePrev(0, 100);
  const r = computeOverlap(20, 100, prev);
  assert(r.overlapWidth === 80, 'right overshoot overlap=80');
  assert(r.leftEdge === 20 && r.rightEdge === 100, 'right overshoot edges');
}

// 3. computeOverlap: partial left overshoot
{
  const prev = makePrev(20, 100);
  const r = computeOverlap(0, 100, prev);
  assert(r.overlapWidth === 80, 'left overshoot overlap=80');
  assert(r.leftEdge === 20 && r.rightEdge === 100, 'left overshoot edges');
}

// 4. computeOverlap: complete miss (no overlap)
{
  const prev = makePrev(0, 50);
  const r = computeOverlap(60, 50, prev);
  assert(r.overlapWidth <= 0, 'complete miss overlap<=0');
}

// 5. resolveTap: perfect snap (within 3px)
{
  const prev = makePrev(0, 100);
  const res = resolveTap({
    xCurrent: 2, widthCurrent: 100, previous: prev, nextLayer: 1, color: '#fff', id: 1,
  });
  assert(res.perfect === true, 'perfect flag set');
  assert(res.miss === false, 'perfect not a miss');
  assert(res.placed !== null && res.placed.x === 0 && res.placed.width === 100, 'perfect snaps to prev');
  assert(res.sliced === null, 'perfect has no slice');
  assert(res.nextWidth === 100, 'perfect nextWidth=prev width');
}

// 6. resolveTap: complete miss -> GAME OVER
{
  const prev = makePrev(0, 50);
  const res = resolveTap({
    xCurrent: 100, widthCurrent: 50, previous: prev, nextLayer: 1, color: '#fff', id: 2,
  });
  assert(res.miss === true, 'miss flag set');
  assert(res.placed === null, 'miss has no placed block');
  assert(res.sliced === null, 'miss has no slice');
  assert(res.nextWidth === 0, 'miss nextWidth=0');
}

// 7. resolveTap: right overshoot slice
{
  const prev = makePrev(0, 100);
  const res = resolveTap({
    xCurrent: 30, widthCurrent: 100, previous: prev, nextLayer: 1, color: '#fff', id: 3,
  });
  assert(res.perfect === false && res.miss === false, 'partial is neither perfect nor miss');
  assert(res.placed !== null && res.placed.x === 30 && res.placed.width === 70, 'right slice placed trimmed');
  assert(res.sliced !== null && res.sliced.side === 'right', 'right slice side=right');
  assert(res.sliced !== null && res.sliced.width === 30, 'right slice width=30');
  assert(res.sliced !== null && res.sliced.x === 100, 'right slice x=100 (leftEdge+overlap)');
  assert(res.nextWidth === 70, 'right slice nextWidth=70');
}

// 8. resolveTap: left overshoot slice
{
  const prev = makePrev(30, 100); // prev occupies [30,130]
  const res = resolveTap({
    xCurrent: 0, widthCurrent: 100, previous: prev, nextLayer: 1, color: '#fff', id: 4,
  });
  assert(res.placed !== null && res.placed.x === 30 && res.placed.width === 70, 'left slice placed trimmed');
  assert(res.sliced !== null && res.sliced.side === 'left', 'left slice side=left');
  assert(res.sliced !== null && res.sliced.width === 30, 'left slice width=30');
  assert(res.sliced !== null && res.sliced.x === 0, 'left slice x=0 (xCurrent)');
  assert(res.nextWidth === 70, 'left slice nextWidth=70');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
