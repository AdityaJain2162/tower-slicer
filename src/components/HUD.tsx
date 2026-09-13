/**
 * HUD — top-of-screen score + streak display shown during PLAYING, plus a
 * persistent mute/sound toggle icon. Uses Press Start 2P for the score and
 * Inter for labels.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONT_DISPLAY, FONT_BODY } from '@/hooks/useFonts';

export interface HUDProps {
  score: number;
  streak: number;
  muted: boolean;
  onToggleMute: () => void;
}

export const HUD = React.memo(function HUD({
  score,
  streak,
  muted,
  onToggleMute,
}: HUDProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.scoreWrap}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.label}>SCORE</Text>
      </View>
      {streak >= 2 && (
        <View style={styles.streak} pointerEvents="none">
          <Ionicons name="flame" size={18} color="#ffb347" />
          <Text style={styles.streakText}>x{streak}</Text>
        </View>
      )}
      <Pressable
        style={styles.mute}
        onPress={onToggleMute}
        hitSlop={12}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 24 }}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color="#fff" />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreWrap: { alignItems: 'center' },
  score: {
    color: '#fff',
    fontFamily: FONT_DISPLAY,
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONT_BODY,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 4,
  },
  streak: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: '#ffb347',
    fontFamily: FONT_BODY,
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 14,
  },
  mute: {
    position: 'absolute',
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
