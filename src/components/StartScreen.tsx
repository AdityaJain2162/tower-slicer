/**
 * StartScreen — IDLE state overlay: logo, best score, daily streak, games
 * played, a settings gear button, and "Tap to Play". Uses Press Start 2P for
 * the title (retro arcade vibe) and Inter for body.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONT_BODY, FONT_BODY_BOLD } from '@/hooks/useFonts';
import { Logo } from './Logo';
import type { PlayerStats } from '@/types';

export interface StartScreenProps {
  best: number;
  bestLoading: boolean;
  stats: PlayerStats;
  statsLoading: boolean;
  onOpenSettings: () => void;
}

export const StartScreen = React.memo(function StartScreen({
  best,
  bestLoading,
  stats,
  statsLoading,
  onOpenSettings,
}: StartScreenProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Settings gear — top-right, tappable. */}
      <Pressable
        style={styles.settingsBtn}
        onPress={onOpenSettings}
        hitSlop={12}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 24 }}
      >
        <Ionicons name="settings" size={22} color="#fff" />
      </Pressable>

      <Logo size={1} />

      <View style={styles.best}>
        <Ionicons name="trophy" size={18} color="#ffd166" />
        <Text style={styles.bestText}>
          {bestLoading ? '—' : `BEST  ${best}`}
        </Text>
      </View>

      {/* Stats row — daily streak + games played. */}
      <View style={styles.statsRow} pointerEvents="none">
        <StatChip
          icon="flame"
          color="#ff9f43"
          label={statsLoading ? '—' : `${stats.dailyStreak} day${stats.dailyStreak === 1 ? '' : 's'}`}
        />
        <StatChip
          icon="game-controller"
          color="#4cc9f0"
          label={statsLoading ? '—' : `${stats.gamesPlayed} games`}
        />
      </View>

      <View style={styles.prompt}>
        <Text style={styles.promptText}>Tap to Play</Text>
      </View>
    </View>
  );
});

interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

function StatChip({ icon, color, label }: StatChipProps) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontFamily: FONT_BODY,
    fontWeight: '700',
    marginLeft: 5,
    fontSize: 12,
    letterSpacing: 0.5,
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
