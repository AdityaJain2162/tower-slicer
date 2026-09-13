/**
 * Thin wrapper around expo-haptics.
 *
 * Every call is wrapped in try/catch so haptics can never crash the game on
 * platforms/emulators that don't support haptic feedback. A `enabled` flag
 * lets the UI mute haptics globally (e.g. a settings toggle).
 */
import * as Haptics from 'expo-haptics';

let enabled = true;

/** Globally enable/disable haptic feedback. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function isHapticsEnabled() {
  return enabled;
}

/** Light impact — played on every successful slice hit. */
export async function hapticHit() {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op: haptics unavailable */
  }
}

/** Softer/medium impact used for the perfect-snap streak combo. */
export async function hapticPerfect() {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* no-op */
  }
}

/** Error notification — played on a miss / game over. */
export async function hapticMiss() {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* no-op */
  }
}

// ── Orbit Rush: Neon Switch haptic cues ────────────────────────────────────
// These map directly to the spec's "Game Juice & Tactile Feedback" requirements
// for Orbit Rush. They reuse the same global `enabled` flag so the existing
// mute toggle covers both games.

/** Light impact — played the instant the player toggles between tracks. */
export async function hapticTrackSwitch() {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op: haptics unavailable */
  }
}

/** Medium impact — played when a Neon Shard is collected. */
export async function hapticShard() {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* no-op */
  }
}

/** Error notification — played on a crash / game over (Orbit Rush). */
export async function hapticCrash() {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* no-op */
  }
}
