/**
 * Core domain types for Tower Slicer.
 * Kept framework-agnostic so the math/logic layer can be unit-tested in isolation.
 */

/** Finite state machine for the game. */
export type GameState = 'IDLE' | 'PLAYING' | 'GAMEOVER';

/** Direction the active block currently travels along the X axis. */
export type Direction = 'ltr' | 'rtl';

/** Axis a layer oscillates on. Even layers use X; odd layers also use X but
 *  alternate starting direction (per spec: "alternate between ltr and rtl"). */
export type Axis = 'x';

/** A block that has been permanently placed in the tower. */
export interface PlacedBlock {
  /** Stable unique id (used as React key + Reanimated node id). */
  id: number;
  /** Layer index; 0 is the foundation. */
  layer: number;
  /** Left edge X relative to the tower container center, in px. */
  x: number;
  /** Width in px. Shrinks as the player slices imperfectly. */
  width: number;
  /** Fixed block height in px. */
  height: number;
  /** Procedural fill color (HSL string). */
  color: string;
}

/** A leftover piece that was sliced off and is animating to its death. */
export interface SlicedPiece {
  id: number;
  /** Left edge X (same coordinate space as PlacedBlock). */
  x: number;
  width: number;
  height: number;
  color: string;
  /** Which side of the overlap it fell from. */
  side: 'left' | 'right';
  /** Layer it was born on (for vertical offset). */
  layer: number;
}

/** Result of resolving a tap against the previous placed block. */
export interface SliceResult {
  /** True when the tap is a complete miss — triggers GAME OVER. */
  miss: boolean;
  /** True when within the perfect-snap tolerance. */
  perfect: boolean;
  /** The block to push onto the tower (null only when miss). */
  placed: PlacedBlock | null;
  /** The leftover piece to animate falling (null on perfect or miss). */
  sliced: SlicedPiece | null;
  /** Width the *next* active block should start with. */
  nextWidth: number;
}

/** Persisted high-score record. */
export interface HighScoreRecord {
  best: number;
}
