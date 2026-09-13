/**
 * Pure, RN-free engine helpers (speed scaling + direction alternation).
 * Kept separate from useGameEngine so they can be unit-tested in plain Node.
 */
import {
  INITIAL_CYCLE_MS,
  MIN_CYCLE_MS,
  SPEED_STEP_EVERY,
  SPEED_STEP_MS,
} from '@/constants/game';
import type { Direction } from '@/types';

/** Compute the oscillation cycle duration (ms) for a placed-block count. */
export function cycleDurationFor(placedCount: number): number {
  const steps = Math.floor(placedCount / SPEED_STEP_EVERY);
  return Math.max(MIN_CYCLE_MS, INITIAL_CYCLE_MS - steps * SPEED_STEP_MS);
}

/** Even layers travel left-to-right; odd layers travel right-to-left. */
export function directionForLayer(layer: number): Direction {
  return layer % 2 === 0 ? 'ltr' : 'rtl';
}
