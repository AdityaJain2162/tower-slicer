/**
 * GameOverModal — end-of-run summary.
 *
 * Originally built for Tower Slicer (score / best / revive), now extended for
 * Orbit Rush: Neon Switch with the monetization hooks from the spec:
 *   - Shards collected this run (when `shards` is provided)
 *   - "🎬 Revive (N left)" rewarded button (when `revivesLeft` is provided)
 *   - "💎 2x Shards" rewarded button (when `onDoubleShards` is provided)
 *
 * Backward compatibility: the original required props (`score`, `best`,
 * `isNewBest`, `canRevive`, `onRestart`, `onRevive`) are unchanged, so the
 * existing Tower Slicer `Game` component keeps typechecking. The Orbit Rush
 * extras are all *optional* and only render when supplied.
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

  // ── Orbit Rush extras (all optional) ─────────────────────────────────────
  /** Shards collected this run. Renders a shard stat when provided. */
  shards?: number;
  /** Remaining revives for this run; customizes the revive button label. */
  revivesLeft?: number;
  /** True when the 2x Shards rewarded ad is available. */
  canDoubleShards?: boolean;
  /** Called when the player taps the "2x Shards" rewarded button. */
  onDoubleShards?: () => void;
}

export const GameOverModal = React.memo(function GameOverModal({
  score,
  best,
  isNewBest,
  canRevive,
  onRestart,
  onRevive,
  shards,
  revivesLeft,
  canDoubleShards,
  onDoubleShards,
}: GameOverModalProps) {
  const orbitMode = shards != null;
  const reviveLabel =
    revivesLeft != null ? `Revive (${revivesLeft} left)` : 'Revive & Keep Tower';

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
          {orbitMode && (
            <>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, styles.shardValue]}>{shards}</Text>
                <Text style={styles.statLabel}>SHARDS</Text>
              </View>
            </>
          )}
        </View>

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

        {orbitMode && canDoubleShards && onDoubleShards && (
          <Pressable
            style={({ pressed }) => [
              styles.doubleButton,
              pressed && styles.reviveButtonPressed,
            ]}
            onPress={onDoubleShards}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 200 }}
          >
            <Ionicons name="diamond" size={18} color="#0f0f1a" />
            <Text style={styles.reviveText}>2x Shards</Text>
          </Pressable>
        )}

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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
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
  stat: { alignItems: 'center', paddingHorizontal: 14 },
  statValue: {
    color: '#fff',
    fontFamily: FONT_BODY_EXTRA_BOLD,
    fontSize: 30,
  },
  shardValue: {
    color: '#4cc9f0',
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
  reviveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd166',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginBottom: 12,
  },
  doubleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4cc9f0',
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
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 8,
    letterSpacing: 2,
    fontSize: 15,
  },
});
