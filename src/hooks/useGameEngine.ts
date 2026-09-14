/**
 * useGameEngine — the brain of Tower Slicer.
 *
 * Owns the finite state machine (IDLE / PLAYING / GAMEOVER), the placed-tower
 * array, the active (moving) block parameters, speed scaling, the combo
 * streak (with combo-expansion rewards), a one-shot revive, and the Reanimated
 * SharedValues that the UI thread animates:
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
 *
 * After each tap the engine emits a `lastEvent` ({type, id}) so the UI/audio
 * layer can react (floating text, SFX, haptics are already fired here).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import {
  BASE_BLOCK_WIDTH,
  BLOCK_HEIGHT,
  COMBO_EXPANSION_PX,
  COMBO_EXPANSION_THRESHOLD,
  HALF_SCREEN_WIDTH,
  INITIAL_CYCLE_MS,
} from '@/constants';
import { colorForLayer } from '@/utils/color';
import { cycleDurationFor, directionForLayer } from '@/utils/engine';
import { resolveTap } from '@/utils/slicing';
import { hapticHit, hapticMiss, hapticPerfect } from '@/services/haptics';
import { useHighScore } from '@/hooks/useHighScore';
import type { Direction, GameEvent, GameState, PlacedBlock, SlicedPiece } from '@/types';

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
  /** Consecutive perfect placements (combo streak). Resets on non-perfect. */
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
  /** Last tap event for the UI/audio layer to react to (key by event.id). */
  lastEvent: GameEvent | null;
  /** True once the player has used their one allowed revive this run. */
  hasRevived: boolean;
  /** Blocks placed in the current (or most recent) run, excluding foundation. */
  runBlocksPlaced: number;
  /** Perfect placements in the current (or most recent) run. */
  runPerfects: number;
  /** Best (highest) perfect streak reached in the current (or most recent) run. */
  runBestStreak: number;
  /** Start a new run from IDLE or GAMEOVER. */
  start: () => void;
  /** Read activeX and resolve the slice. Triggers haptics + state updates. */
  handleTap: () => void;
  /** Restart immediately from GAMEOVER. */
  restart: () => void;
  /** Use the one-shot revive: reset active block to top width, resume play. */
  revive: () => void;
  /** Return to the IDLE (start) screen from GAMEOVER without a new run. */
  goHome: () => void;
  /** Remove a finished falling sliced piece by id. */
  removeSlicedPiece: (id: number) => void;
}

export function useGameEngine(): UseGameEngineResult {
  const { best, loading: bestLoading, submitScore } = useHighScore();

  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [tower, setTower] = useState<PlacedBlock[]>([]);
  const [slicedPieces, setSlicedPieces] = useState<SlicedPiece[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [hasRevived, setHasRevived] = useState(false);
  // Per-run stats (reset on start, persisted through game-over for the modal).
  const [runBlocksPlaced, setRunBlocksPlaced] = useState(0);
  const [runPerfects, setRunPerfects] = useState(0);
  const [runBestStreak, setRunBestStreak] = useState(0);

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

  // Monotonic id counter for placed/sliced pieces and events.
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
    setLastEvent(null);
    setHasRevived(false);
    setRunBlocksPlaced(0);
    setRunPerfects(0);
    setRunBestStreak(0);
    // towerShiftY = activeLayer * BLOCK_HEIGHT keeps the active layer (layer 1)
    // vertically centered while the foundation sits one block below it.
    towerShiftY.value = BLOCK_HEIGHT;
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

  const removeSlicedPiece = useCallback((id: number) => {
    setSlicedPieces((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
      setLastEvent({ type: 'miss', id: nextId() });
      // Freeze the moving block where it was missed for the game-over visual.
      setGameState('GAMEOVER');
      void submitScore(score);
      return;
    }

    // Track per-run stats (count this placement).
    setRunBlocksPlaced((n) => n + 1);

    let placed = result.placed!;
    let nextWidth = result.nextWidth;

    if (result.perfect) {
      hapticPerfect();
      setRunPerfects((n) => n + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setRunBestStreak((s) => Math.max(s, newStreak));

      // Combo Expansion: at streak >= 5 and odd, grow the placed block back.
      if (newStreak >= COMBO_EXPANSION_THRESHOLD && newStreak % 2 === 1) {
        const expanded = Math.min(placed.width + COMBO_EXPANSION_PX, BASE_BLOCK_WIDTH);
        // Center the expansion so the block stays balanced on the tower.
        const dx = (expanded - placed.width) / 2;
        placed = { ...placed, x: placed.x - dx, width: expanded };
        nextWidth = expanded;
        setLastEvent({ type: 'expansion', id: nextId() });
      } else {
        setLastEvent({ type: 'perfect', id: nextId() });
      }
    } else {
      hapticHit();
      setStreak(0);
      setLastEvent({ type: 'hit', id: nextId() });
    }

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
      width: nextWidth,
      color: colorForLayer(newLayer),
      layer: newLayer,
      direction: directionForLayer(newLayer),
      cycleMs: cycleDurationFor(newTower.length),
    });
  }, [gameState, tower, active, activeX, towerShiftY, score, streak, submitScore]);

  const revive = useCallback(() => {
    if (gameState !== 'GAMEOVER' || hasRevived) return;
    setHasRevived(true);
    // Reset the active (top) block to the width of the layer below it (the
    // current top placed block) so the next placement can fully overlap.
    const topPlaced = tower[tower.length - 1];
    const resetWidth = topPlaced ? topPlaced.width : BASE_BLOCK_WIDTH;
    const layer = active.layer;
    activeX.value = directionForLayer(layer) === 'ltr'
      ? -HALF_SCREEN_WIDTH
      : HALF_SCREEN_WIDTH;
    setActive({
      width: resetWidth,
      color: colorForLayer(layer),
      layer,
      direction: directionForLayer(layer),
      cycleMs: cycleDurationFor(tower.length),
    });
    setLastEvent(null);
    setGameState('PLAYING');
  }, [gameState, hasRevived, tower, active.layer, activeX]);

  const goHome = useCallback(() => {
    setGameState('IDLE');
  }, []);

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
      lastEvent,
      hasRevived,
      runBlocksPlaced,
      runPerfects,
      runBestStreak,
      start,
      handleTap,
      restart,
      revive,
      goHome,
      removeSlicedPiece,
    }),
    [gameState, score, streak, best, bestLoading, tower, slicedPieces, active, activeX, towerShiftY, lastEvent, hasRevived, runBlocksPlaced, runPerfects, runBestStreak, start, handleTap, restart, revive, goHome, removeSlicedPiece],
  );
}
