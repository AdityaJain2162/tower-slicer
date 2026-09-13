/**
 * GameOverModal — shown on GAMEOVER: current score vs personal best + Restart.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface GameOverModalProps {
  score: number;
  best: number;
  isNewBest: boolean;
  onRestart: () => void;
}

export const GameOverModal = React.memo(function GameOverModal({
  score,
  best,
  isNewBest,
  onRestart,
}: GameOverModalProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>GAME OVER</Text>

        {isNewBest && (
          <View style={styles.newBest}>
            <Ionicons name="ribbon" size={16} color="#ffd166" />
            <Text style={styles.newBestText}>NEW BEST!</Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>SCORE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{best}</Text>
            <Text style={styles.statLabel}>BEST</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onRestart}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 200 }}
        >
          <Ionicons name="refresh" size={20} color="#0f0f1a" />
          <Text style={styles.buttonText}>RESTART</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 280,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#ff6b6b',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  newBest: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,209,102,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  newBestText: {
    color: '#ffd166',
    fontWeight: '800',
    marginLeft: 5,
    fontSize: 12,
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  stat: { alignItems: 'center', paddingHorizontal: 18 },
  statValue: { color: '#fff', fontSize: 34, fontWeight: '800' },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#0f0f1a',
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 2,
    fontSize: 15,
  },
});
