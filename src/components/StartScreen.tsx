/**
 * StartScreen — IDLE state overlay: title, best score, and "Tap to Play".
 * Uses Press Start 2P for the title (retro arcade vibe) and Inter for body.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD } from '@/hooks/useFonts';

export interface StartScreenProps {
  best: number;
  bestLoading: boolean;
}

export const StartScreen = React.memo(function StartScreen({
  best,
  bestLoading,
}: StartScreenProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>TOWER SLICER</Text>
      <Text style={styles.subtitle}>Stack the perfect tower</Text>

      <View style={styles.best}>
        <Ionicons name="trophy" size={18} color="#ffd166" />
        <Text style={styles.bestText}>
          {bestLoading ? '—' : `BEST  ${best}`}
        </Text>
      </View>

      <View style={styles.prompt}>
        <Text style={styles.promptText}>Tap to Play</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONT_BODY,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 12,
  },
  best: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bestText: {
    color: '#ffd166',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 6,
    fontSize: 14,
    letterSpacing: 1,
  },
  prompt: {
    position: 'absolute',
    bottom: 120,
  },
  promptText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONT_BODY_BOLD,
    fontSize: 18,
    letterSpacing: 2,
  },
});
