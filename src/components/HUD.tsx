/**
 * HUD — top-of-screen score + streak display shown during PLAYING.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface HUDProps {
  score: number;
  streak: number;
}

export const HUD = React.memo(function HUD({ score, streak }: HUDProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.scoreWrap}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.label}>SCORE</Text>
      </View>
      {streak >= 2 && (
        <View style={styles.streak}>
          <Ionicons name="flame" size={18} color="#ffb347" />
          <Text style={styles.streakText}>x{streak}</Text>
        </View>
      )}
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
    fontSize: 48,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 2,
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
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 14,
  },
});
