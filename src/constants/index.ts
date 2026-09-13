/**
 * Re-export all game constants and add the React-Native-dependent screen
 * dimensions. Pure numeric constants live in `./game` (RN-free) so the
 * math/logic layer can be unit-tested in plain Node.
 */
export * from './game';

import { Dimensions } from 'react-native';

export const SCREEN = {
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
} as const;

/** Horizontal travel amplitude: block oscillates in [-HALF_W, +HALF_W]. */
export const HALF_SCREEN_WIDTH = SCREEN.width / 2;
