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
