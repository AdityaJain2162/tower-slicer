/**
 * Pure numeric game constants — no React Native dependency.
 * Importing this module must NOT pull in `react-native` so the math/logic
 * layer stays unit-testable in plain Node.
 */

/** Fixed block height for every layer. */
export const BLOCK_HEIGHT = 36;

/** Starting width of the foundation / first active block, in px. */
export const BASE_BLOCK_WIDTH = 200;

/** Tap offset within this many px of the previous block counts as "perfect". */
export const PERFECT_TOLERANCE_PX = 8;
/** Alias used by the difficulty spec ("Perfect Snap" tolerance). */
export const SNAP_TOLERANCE = PERFECT_TOLERANCE_PX;

/** Cycle duration (ms) for the oscillation at the start of a run. */
export const INITIAL_CYCLE_MS = 2400;

/** Floor for cycle duration as speed ramps up. */
export const MIN_CYCLE_MS = 1100;

/** Every N placed blocks, shave this many ms off the cycle duration. */
export const SPEED_STEP_EVERY = 5;
export const SPEED_STEP_MS = 250;

/** Hue advance per layer, in degrees — produces a continuous rainbow. */
export const HUE_STEP_DEG = 6;

/** AsyncStorage key for the persisted high score. */
export const HIGH_SCORE_KEY = '@tower_slicer/high_score';

/** Vertical offset (px) the active layer sits above the tower anchor. */
export const ACTIVE_LAYER_OFFSET = BLOCK_HEIGHT;

/** Combo Expansion: consecutive perfect placements build comboStreak. */
export const COMBO_EXPANSION_THRESHOLD = 5;
/** Width (px) added to the placed block on a combo-expansion reward. */
export const COMBO_EXPANSION_PX = 14;
