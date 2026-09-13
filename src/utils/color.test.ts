/* Runtime test harness for the color generator. npx tsx src/utils/color.test.ts */
import { colorForLayer, hsl, BASE_HUE } from '@/utils/color';
import { HUE_STEP_DEG } from '@/constants/game';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) passed++; else { failed++; console.error(`  FAIL: ${msg}`); }
}

// 1. hsl formats correctly
assert(hsl(200, 65, 55) === 'hsl(200, 65%, 55%)', 'hsl formats with rounded ints');

// 2. layer 0 uses BASE_HUE
assert(colorForLayer(0) === `hsl(${BASE_HUE}, 65%, 55%)`, 'layer 0 uses base hue');

// 3. layer 1 advances by HUE_STEP_DEG
assert(colorForLayer(1) === `hsl(${(BASE_HUE + HUE_STEP_DEG) % 360}, 65%, 55%)`, 'layer 1 advances hue');

// 4. hue wraps around 360
const wrapLayer = Math.ceil(360 / HUE_STEP_DEG);
assert(colorForLayer(wrapLayer) === `hsl(${(BASE_HUE + wrapLayer * HUE_STEP_DEG) % 360}, 65%, 55%)`, 'hue wraps mod 360');
assert(colorForLayer(wrapLayer).startsWith('hsl('), 'wrapped color still valid hsl');

// 5. consecutive layers differ
assert(colorForLayer(5) !== colorForLayer(6), 'consecutive layers differ');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
