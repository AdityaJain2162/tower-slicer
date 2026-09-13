/**
 * Tunable game constants. Centralized so balance changes live in one place.
 */
import { Dimensions } from 'react-native';

export const SCREEN = {
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
} as const;

/** Fixed block height for every layer. */
export const BLOCK_HEIGHT = 36;

/** Starting width of the foundation / first active block, in px. */
export const BASE_BLOCK_WIDTH = 200;

/** Horizontal travel amplitude: block oscillates in [-HALF_W, +HALF_W]. */
export const HALF_SCREEN_WIDTH = SCREEN.width / 2;

/** Tap offset within this many px of the previous block counts as "perfect". */
export const PERFECT_TOLERANCE_PX = 3;

/** Cycle duration (ms) for the oscillation at the start of a run. */
export const INITIAL_CYCLE_MS = 1800;

/** Floor for cycle duration as speed ramps up. */
export const MIN_CYCLE_MS = 800;

/** Every N placed blocks, shave this many ms off the cycle duration. */
export const SPEED_STEP_EVERY = 5;
export const SPEED_STEP_MS = 250;

/** Hue advance per layer, in degrees — produces a continuous rainbow. */
export const HUE_STEP_DEG = 6;

/** AsyncStorage key for the persisted high score. */
export const HIGH_SCORE_KEY = '@tower_slicer/high_score';

/** Vertical offset (px) the active layer sits above the tower anchor. */
export const ACTIVE_LAYER_OFFSET = BLOCK_HEIGHT;
