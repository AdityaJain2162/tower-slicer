/**
 * Procedural HSL color generator for Tower Slicer.
 *
 * The hue advances by HUE_STEP_DEG per layer so the rising tower reads as one
 * continuous rainbow gradient. Saturation/lightness are held constant for a
 * clean, modern look. Pure functions, no RN dependency.
 */
import { HUE_STEP_DEG } from '@/constants/game';

/** Convert an HSL triple to an `hsl(h, s%, l%)` CSS string. */
export function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/** Starting hue for the foundation (layer 0). */
export const BASE_HUE = 200;
const SATURATION = 65;
const LIGHTNESS = 55;

/** Compute the fill color for a given layer index. */
export function colorForLayer(layer: number): string {
  // Modulo 360 keeps hue in [0, 360) and makes the gradient loop seamlessly.
  const hue = (BASE_HUE + layer * HUE_STEP_DEG) % 360;
  return hsl(hue, SATURATION, LIGHTNESS);
}
