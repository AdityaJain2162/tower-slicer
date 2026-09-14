/**
 * GameOverModal — end-of-run summary.
 *
 * Shows the run's score, best, this-run stats (blocks placed, best streak,
 * perfects), a rewarded revive button (when available), a restart button,
 * and a home button to return to the start screen.
 *
 * Uses Press Start 2P for the title and Inter for body text.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONT_DISPLAY, FONT_BODY, FONT_BODY_BOLD, FONT_BODY_EXTRA_BOLD } from '@/hooks/useFonts';

export interface GameOverModalProps {
  score: number;
  best: number;
  isNewBest: boolean;
  /** True when a revive is still allowed this run and an ad is ready. */
  canRevive: boolean;
  onRestart: () => void;
  onRevive: () => void;
  onHome: () => void;
  /** Blocks placed this run (excluding the foundation). */
  runBlocksPlaced?: number;
  /** Best perfect-streak reached this run. */
  runBestStreak?: number;
  /** Perfect placements this run. */
  runPerfects?: number;
}

export const GameOverModal = React.memo(function GameOverModal({
  score,
  best,
  isNewBest,
  canRevive,
  onRestart,
  onRevive,
  onHome,
  runBlocksPlaced,
  runBestStreak,
  runPerfects,
}: GameOverModalProps) {
  const reviveLabel = 'Revive & Keep Tower';

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

        {/* This-run mini-stats row. */}
        {runBlocksPlaced != null && (
          <View style={styles.miniRow} pointerEvents="none">
            <MiniStat icon="cube" label={`${runBlocksPlaced}`} />
            {runBestStreak != null && <MiniStat icon="flame" label={`${runBestStreak}`} />}
            {runPerfects != null && <MiniStat icon="sparkles" label={`${runPerfects}`} />}
          </View>
        )}

        {canRevive && (
          <Pressable
            style={({ pressed }) => [
              styles.reviveButton,
              pressed && styles.reviveButtonPressed,
            ]}
            onPress={onRevive}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 200 }}
          >
            <Ionicons name="play-circle" size={20} color="#0f0f1a" />
            <Text style={styles.reviveText}>{reviveLabel}</Text>
          </Pressable>
        )}

        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onHome}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 200 }}
          >
            <Ionicons name="home" size={18} color="#fff" />
            <Text style={styles.secondaryText}>HOME</Text>
          </Pressable>

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
    </View>
  );
});

interface MiniStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

function MiniStat({ icon, label }: MiniStatProps) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.6)" />
      <Text style={styles.miniStatText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
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
    fontFamily: FONT_DISPLAY,
    fontSize: 18,
    letterSpacing: 2,
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
    fontFamily: FONT_BODY_BOLD,
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
  statValue: {
    color: '#fff',
    fontFamily: FONT_BODY_EXTRA_BOLD,
    fontSize: 30,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONT_BODY,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  miniRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStatText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 4,
    fontSize: 12,
  },
  reviveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd166',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginBottom: 12,
  },
  reviveButtonPressed: { opacity: 0.85 },
  reviveText: {
    color: '#0f0f1a',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 8,
    letterSpacing: 1,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryText: {
    color: '#fff',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 6,
    letterSpacing: 1.5,
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#0f0f1a',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 8,
    letterSpacing: 2,
    fontSize: 15,
  },
});
