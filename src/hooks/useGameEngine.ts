/**
 * useGameEngine — the brain of Tower Slicer.
 *
 * Owns the finite state machine (IDLE / PLAYING / GAMEOVER), the placed-tower
 * array, the active (moving) block parameters, speed scaling, the streak
 * combo, and the Reanimated SharedValues that the UI thread animates:
 *
 *   activeX      — current left-edge X of the moving block (animated by the
 *                  ActiveBlock component's UI-thread loop).
 *   towerShiftY  — vertical offset of the whole tower container; animates
 *                  downward by BLOCK_HEIGHT on each placement so the active
 *                  layer stays vertically centered.
 *
 * The hook does NOT drive motion with setInterval / JS rAF. Positioning is
 * purely Reanimated SharedValues + animated styles. handleTap reads the
 * current X synchronously from the SharedValue at tap time.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import {
  BASE_BLOCK_WIDTH,
  BLOCK_HEIGHT,
  HALF_SCREEN_WIDTH,
  INITIAL_CYCLE_MS,
} from '@/constants';
import { colorForLayer } from '@/utils/color';
import { cycleDurationFor, directionForLayer } from '@/utils/engine';
import { resolveTap } from '@/utils/slicing';
import { hapticHit, hapticMiss, hapticPerfect } from '@/services/haptics';
import { useHighScore } from '@/hooks/useHighScore';
import type { Direction, GameState, PlacedBlock, SlicedPiece } from '@/types';

export interface ActiveBlockParams {
  /** Width of the currently moving block (px). */
  width: number;
  /** Fill color of the currently moving block. */
  color: string;
  /** Layer the active block will occupy once placed. */
  layer: number;
  /** Travel direction for this layer's oscillation. */
  direction: Direction;
  /** Current oscillation cycle duration (ms). */
  cycleMs: number;
}

export interface UseGameEngineResult {
  gameState: GameState;
  score: number;
  streak: number;
  best: number;
  bestLoading: boolean;
  /** All permanently placed blocks (foundation + slices). */
  tower: PlacedBlock[];
  /** Leftover pieces currently animating to their death. */
  slicedPieces: SlicedPiece[];
  /** Parameters for the moving block. */
  active: ActiveBlockParams;
  /** SharedValue: current left-edge X of the moving block. */
  activeX: ReturnType<typeof useSharedValue<number>>;
  /** SharedValue: vertical offset of the tower container. */
  towerShiftY: ReturnType<typeof useSharedValue<number>>;
  /** Start a new run from IDLE or GAMEOVER. */
  start: () => void;
  /** Read activeX and resolve the slice. Triggers haptics + state updates. */
  handleTap: () => void;
  /** Restart immediately from GAMEOVER. */
  restart: () => void;
}

export function useGameEngine(): UseGameEngineResult {
  const { best, loading: bestLoading, submitScore } = useHighScore();

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [tower, setTower] = useState<PlacedBlock[]>([]);
  const [slicedPieces, setSlicedPieces] = useState<SlicedPiece[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Active block params. Layer 0 is the foundation; the first *moving* block
  // is layer 1.
  const [active, setActive] = useState<ActiveBlockParams>({
    width: BASE_BLOCK_WIDTH,
    color: colorForLayer(1),
    layer: 1,
    direction: directionForLayer(1),
    cycleMs: INITIAL_CYCLE_MS,
  });

  // SharedValues animated on the UI thread.
  const activeX = useSharedValue(0);
  const towerShiftY = useSharedValue(0);

  // Monotonic id counter for placed/sliced pieces.
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const reset = useCallback(() => {
    idRef.current = 0;
    const foundation: PlacedBlock = {
      id: nextId(),
      layer: 0,
      x: -BASE_BLOCK_WIDTH / 2,
      width: BASE_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: colorForLayer(0),
    };
    setTower([foundation]);
    setSlicedPieces([]);
    setScore(0);
    setStreak(0);
    towerShiftY.value = 0;
    activeX.value = -HALF_SCREEN_WIDTH;
    setActive({
      width: BASE_BLOCK_WIDTH,
      color: colorForLayer(1),
      layer: 1,
      direction: directionForLayer(1),
      cycleMs: INITIAL_CYCLE_MS,
    });
  }, [activeX, towerShiftY]);

  const start = useCallback(() => {
    reset();
    setGameState('PLAYING');
  }, [reset]);

  const restart = useCallback(() => {
    reset();
    setGameState('PLAYING');
  }, [reset]);

  const handleTap = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const previous = tower[tower.length - 1];
    if (!previous) return;

    const xCurrent = activeX.value;
    const { width: widthCurrent, layer: nextLayer, color } = active;

    const result = resolveTap({
      xCurrent,
      widthCurrent,
      previous,
      nextLayer,
      color,
      id: nextId(),
    });

    if (result.miss) {
      hapticMiss();
      // Freeze the moving block where it was missed for the game-over visual.
      setGameState('GAMEOVER');
      void submitScore(score);
      return;
    }

    if (result.perfect) {
      hapticPerfect();
      setStreak((s) => s + 1);
    } else {
      hapticHit();
      setStreak(0);
    }

    const placed = result.placed!;
    const newTower = [...tower, placed];
    setTower(newTower);
    setScore((s) => s + 1);

    // Animate the sliced leftover falling (UI thread). We keep it in state so
    // the SlicedPiece layer renders it; the component unmounts itself when the
    // fall animation finishes (onComplete).
    if (result.sliced) {
      setSlicedPieces((prev) => [...prev, result.sliced!]);
    }

    // Shift the tower down so the next active layer stays centered.
    towerShiftY.value = towerShiftY.value + BLOCK_HEIGHT;

    // Spawn the next active block.
    const newLayer = nextLayer + 1;
    activeX.value = directionForLayer(newLayer) === 'ltr'
      ? -HALF_SCREEN_WIDTH
      : HALF_SCREEN_WIDTH;
    setActive({
      width: result.nextWidth,
      color: colorForLayer(newLayer),
      layer: newLayer,
      direction: directionForLayer(newLayer),
      cycleMs: cycleDurationFor(newTower.length),
    });
  }, [gameState, tower, active, activeX, towerShiftY, score, submitScore]);

  return useMemo(
    () => ({
      gameState,
      score,
      streak,
      best,
      bestLoading,
      tower,
      slicedPieces,
      active,
      activeX,
      towerShiftY,
      start,
      handleTap,
      restart,
    }),
    [gameState, score, streak, best, bestLoading, tower, slicedPieces, active, activeX, towerShiftY, start, handleTap, restart],
  );
}
