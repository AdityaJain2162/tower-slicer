/**
 * JuiceEffects — the "game juice" + tactile feedback layer for Orbit Rush.
 *
 * This module hosts the Orbit Rush VFX/haptics primitives that the engine
 * canvas wires up:
 *
 *   - Haptic cues (track switch / shard / crash) — thin wrappers over the
 *     existing `src/services/haptics` module so they honor the global mute.
 *   - `useScreenShake()` — a hook exposing a `shakeRootStyle` (Reanimated
 *     animated style) plus a `triggerShake()` you can fire on near-miss and
 *     game-over. Runs entirely on the UI thread.
 *   - `NearMissPopup` — a floating "NEAR MISS! +50" label that pops in,
 *     drifts up, and fades out. Re-mount it (via a `key`) to retrigger.
 *   - `PlayerTrail` — renders 3 ghost orbs trailing the player position
 *     with decaying opacity. Driven by Reanimated SharedValues so there are
 *     zero JS-thread layout re-renders per frame.
 *
 * Everything here is self-contained and does NOT import the engine, so it
 * can be developed in parallel with `src/game/useOrbitEngine.ts`.
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import {
  hapticTrackSwitch,
  hapticShard,
  hapticCrash,
} from '@/services/haptics';
import { FONT_DISPLAY } from '@/hooks/useFonts';

// ── Haptic cues ─────────────────────────────────────────────────────────────
// Re-exported here so the engine only needs to import from one juice module.
// Each is try/catch guarded inside the haptics service, so they are no-ops on
// platforms without haptics and never crash the game.

/** Fire a Light impact the instant the player toggles tracks. */
export function juiceTrackSwitch() {
  void hapticTrackSwitch();
}

/** Fire a Medium impact when a Neon Shard is collected. */
export function juiceShard() {
  void hapticShard();
}

/** Fire an Error notification on crash / game over. */
export function juiceCrash() {
  void hapticCrash();
}

// ── Screen shake ───────────────────────────────────────────────────────────

const SHAKE_DURATION_MS = 45;
const SHAKE_COUNT = 6;
const SHAKE_AMP = 7;

export interface UseScreenShakeResult {
  /** Animated style to spread onto the root view you want shaken. */
  shakeRootStyle: AnimatedStyle<any>;
  /** Trigger a shake burst (call on near-miss and game-over). */
  triggerShake: (amp?: number) => void;
}

/**
 * Screen-shake hook. Returns an animated style (`translateX` wobble) and a
 * `triggerShake` that runs an alternating ±amp decay on the UI thread.
 */
export function useScreenShake(): UseScreenShakeResult {
  const shakeX = useSharedValue(0);

  const triggerShake = (amp: number = SHAKE_AMP) => {
    shakeX.value = withSequence(
      ...Array(SHAKE_COUNT)
        .fill(0)
        .map((_, i) =>
          withTiming((i % 2 === 0 ? 1 : -1) * amp, {
            duration: SHAKE_DURATION_MS,
            easing: Easing.linear,
          }),
        ),
      withTiming(0, { duration: SHAKE_DURATION_MS }),
    );
  };

  const shakeRootStyle: AnimatedStyle<any> = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return { shakeRootStyle, triggerShake };
}

// ── Near-miss / combo popup ─────────────────────────────────────────────────

export interface NearMissPopupProps {
  /** Text to display (e.g. "NEAR MISS! +50"). */
  text: string;
  /** Accent color for the label. */
  color?: string;
  /** Called once the float-out animation completes (parent unmounts). */
  onDone?: () => void;
}

const POPUP_SCALE_IN_MS = 140;
const POPUP_HOLD_MS = 350;
const POPUP_DRIFT_MS = 450;
const POPUP_DRIFT_PX = -70;

/**
 * Floating "NEAR MISS! +50" label. Pops in (scale + fade), holds, then
 * drifts up and fades out on the UI thread. Re-mount via `key` to retrigger.
 */
export function NearMissPopup({ text, color = '#4ade80', onDone }: NearMissPopupProps) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: POPUP_SCALE_IN_MS, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 80 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: POPUP_SCALE_IN_MS }),
      withDelay(
        POPUP_HOLD_MS,
        withTiming(0, { duration: POPUP_DRIFT_MS, easing: Easing.in(Easing.quad) }),
      ),
    );
    translateY.value = withDelay(
      POPUP_SCALE_IN_MS,
      withTiming(POPUP_DRIFT_PX, {
        duration: POPUP_HOLD_MS + POPUP_DRIFT_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    // Sentinel to fire onDone after the full timeline.
    opacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(1, { duration: POPUP_SCALE_IN_MS + POPUP_HOLD_MS + POPUP_DRIFT_MS }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, [scale, opacity, translateY, onDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[popupStyles.container, animatedStyle]} pointerEvents="none">
      <Animated.Text style={[popupStyles.text, { color }]}>{text}</Animated.Text>
    </Animated.View>
  );
}

const popupStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});

// ── Player trail ────────────────────────────────────────────────────────────

export interface PlayerTrailProps {
  /**
   * SharedValues for the player's animated center position. The engine
   * updates these on the UI thread; the trail reads them with a small
   * positional lag built into the style so ghosts trail behind.
   */
  playerX: SharedValue<number>;
  playerY: SharedValue<number>;
  /** Player radius (px), used to size the ghost orbs. */
  radius?: number;
  /** Base color of the player orb (ghosts tint toward this). */
  color?: string;
}

const TRAIL_GHOST_COUNT = 3;

/**
 * Renders 3 ghost orbs trailing the player. Each ghost reads the player's
 * current animated position and lags behind by a fixed pixel offset that
 * grows per ghost, with opacity decaying from ghost 0 → ghost N. All work
 * happens on the UI thread (no JS re-renders per frame).
 *
 * The engine is expected to drive `playerX`/`playerY` as Reanimated
 * SharedValues derived from the orbit polar conversion. Because the player
 * moves along a circle, a simple translate lag produces a believable trail;
 * for a more accurate motion-blur trail the engine can later feed per-ghost
 * delayed SharedValues instead.
 *
 * One `useAnimatedStyle` hook per ghost (fixed count = 3) keeps this
 * hook-safe — we deliberately avoid calling hooks inside a `.map()`.
 */
export function PlayerTrail({
  playerX,
  playerY,
  radius = 9,
  color = '#7c5cff',
}: PlayerTrailProps) {
  // Fixed 3 ghosts → 3 hooks (rules-of-hooks safe).
  const g0 = useAnimatedStyle(() => ({
    transform: [{ translateX: playerX.value - 6 }, { translateY: playerY.value }],
    opacity: 0.5,
  }));
  const g1 = useAnimatedStyle(() => ({
    transform: [{ translateX: playerX.value - 12 }, { translateY: playerY.value }],
    opacity: 0.3,
  }));
  const g2 = useAnimatedStyle(() => ({
    transform: [{ translateX: playerX.value - 18 }, { translateY: playerY.value }],
    opacity: 0.12,
  }));
  const ghostStyles = [g0, g1, g2];
  // Defensive: the fixed hook count above must match the catalog length.
  if (ghostStyles.length !== TRAIL_GHOST_COUNT) return null;

  return (
    <>
      {ghostStyles.map((style, i) => {
        const ghostRadius = radius * (1 - (i + 1) * 0.12);
        return (
          <Animated.View
            key={i}
            style={[
              trailStyles.ghost,
              {
                width: ghostRadius * 2,
                height: ghostRadius * 2,
                borderRadius: ghostRadius,
                backgroundColor: color,
              },
              style,
            ]}
            pointerEvents="none"
          />
        );
      })}
    </>
  );
}

const trailStyles = StyleSheet.create({
  ghost: {
    position: 'absolute',
  },
});
