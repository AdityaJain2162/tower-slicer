/**
 * Pure slicing math for Tower Slicer.
 *
 * All functions are side-effect free and framework-agnostic so they can be
 * unit-tested in isolation. Coordinates are in the tower-container space where
 * x=0 is the horizontal center; a block occupies [x, x+width].
 */
import { BLOCK_HEIGHT, PERFECT_TOLERANCE_PX } from '@/constants/game';
import type { PlacedBlock, SliceResult, SlicedPiece } from '@/types';

export interface ResolveTapInput {
  /** Current left-edge X of the moving block at the moment of the tap. */
  xCurrent: number;
  /** Width of the moving block at the moment of the tap. */
  widthCurrent: number;
  /** The most recently placed block (the one we slice against). */
  previous: PlacedBlock;
  /** Layer index the new block will occupy. */
  nextLayer: number;
  /** Color for the new block. */
  color: string;
  /** Stable id for the new block. */
  id: number;
}

/**
 * Compute the overlap between the moving block and the previous placed block.
 * Returns the [leftEdge, rightEdge] of the overlap region (rightEdge <= leftEdge
 * means no overlap).
 */
export function computeOverlap(
  xCurrent: number,
  widthCurrent: number,
  previous: PlacedBlock,
): { leftEdge: number; rightEdge: number; overlapWidth: number } {
  const leftEdge = Math.max(xCurrent, previous.x);
  const rightEdge = Math.min(
    xCurrent + widthCurrent,
    previous.x + previous.width,
  );
  const overlapWidth = rightEdge - leftEdge;
  return { leftEdge, rightEdge, overlapWidth };
}

/**
 * Resolve a tap into a SliceResult: a miss (game over), a perfect snap, or a
 * partial slice that trims the block and produces a falling leftover piece.
 *
 * Spec rules implemented:
 *  - |xCurrent - xPrevious| <= PERFECT_TOLERANCE_PX  -> perfect, snap to previous.
 *  - overlapWidth <= 0                               -> GAME OVER (miss).
 *  - overlapWidth > 0                                -> trim + slice leftover.
 */
export function resolveTap(input: ResolveTapInput): SliceResult {
  const { xCurrent, widthCurrent, previous, nextLayer, color, id } = input;

  // Perfect snap: within tolerance, align exactly with the previous block.
  if (Math.abs(xCurrent - previous.x) <= PERFECT_TOLERANCE_PX) {
    const placed: PlacedBlock = {
      id,
      layer: nextLayer,
      x: previous.x,
      width: previous.width,
      height: BLOCK_HEIGHT,
      color,
    };
    return {
      miss: false,
      perfect: true,
      placed,
      sliced: null,
      nextWidth: previous.width,
    };
  }

  const { leftEdge, overlapWidth } = computeOverlap(xCurrent, widthCurrent, previous);

  // Complete miss — no overlap at all.
  if (overlapWidth <= 0) {
    return { miss: true, perfect: false, placed: null, sliced: null, nextWidth: 0 };
  }

  // Partial hit: trim the placed block to the overlap and slice the rest off.
  const placed: PlacedBlock = {
    id,
    layer: nextLayer,
    x: leftEdge,
    width: overlapWidth,
    height: BLOCK_HEIGHT,
    color,
  };

  const sliceWidth = widthCurrent - overlapWidth;
  // The leftover sits on the side of the moving block that overshoots.
  const side: SlicedPiece['side'] =
    xCurrent < previous.x ? 'left' : 'right';
  const slicedX = side === 'left' ? xCurrent : leftEdge + overlapWidth;

  const sliced: SlicedPiece = {
    id,
    x: slicedX,
    width: sliceWidth,
    height: BLOCK_HEIGHT,
    color,
    side,
    layer: nextLayer,
  };

  return {
    miss: false,
    perfect: false,
    placed,
    sliced,
    nextWidth: overlapWidth,
  };
}
