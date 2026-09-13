/**
 * useFonts — loads Press Start 2P (titles/score) and Inter (body) on mount.
 *
 * Returns `loaded` (boolean). The app should wait for `loaded` before
 * rendering text that uses these fonts, otherwise RN falls back to the
 * system font for the first frame.
 */
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';

import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

export const FONT_DISPLAY = 'PressStart2P_400Regular';
export const FONT_BODY = 'Inter_400Regular';
export const FONT_BODY_BOLD = 'Inter_700Bold';
export const FONT_BODY_EXTRA_BOLD = 'Inter_800ExtraBold';

export function useFonts(): { loaded: boolean } {
  const [customLoaded, setCustomLoaded] = useState(false);

  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          PressStart2P_400Regular,
        });
        setCustomLoaded(true);
      } catch {
        setCustomLoaded(true); // proceed with fallback font
      }
    })();
  }, []);

  return { loaded: interLoaded && customLoaded };
}
