/**
 * useStats — persisted player statistics via AsyncStorage.
 *
 * Tracks: games played, total blocks placed, best perfect-streak, total
 * perfect placements, and a daily-play streak (consecutive days the player
 * has played at least one game). Every AsyncStorage operation is wrapped in
 * try/catch so a corrupted/unavailable store degrades gracefully to
 * in-memory defaults.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATS_KEY } from '@/constants/game';
import { nextDailyStreak, todayKey } from '@/utils/date';
import type { PlayerStats } from '@/types';

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalBlocksPlaced: 0,
  bestStreak: 0,
  totalPerfects: 0,
  dailyStreak: 0,
  lastPlayedDate: null,
};

export interface UseStatsResult {
  stats: PlayerStats;
  loading: boolean;
  /**
   * Record the end of a run. Updates gamesPlayed, totalBlocksPlaced,
   * bestStreak, totalPerfects, and the daily-play streak (once per day).
   * Returns the updated stats.
   */
  recordRun: (input: {
    blocksPlaced: number;
    runBestStreak: number;
    perfectsThisRun: number;
  }) => Promise<PlayerStats>;
  /** Reset all stats to defaults (e.g. for a "clear progress" action). */
  resetStats: () => Promise<void>;
}

function sanitize(raw: unknown): PlayerStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATS };
  const r = raw as Partial<PlayerStats>;
  return {
    gamesPlayed: Math.max(0, Math.floor(r.gamesPlayed ?? 0)),
    totalBlocksPlaced: Math.max(0, Math.floor(r.totalBlocksPlaced ?? 0)),
    bestStreak: Math.max(0, Math.floor(r.bestStreak ?? 0)),
    totalPerfects: Math.max(0, Math.floor(r.totalPerfects ?? 0)),
    dailyStreak: Math.max(0, Math.floor(r.dailyStreak ?? 0)),
    lastPlayedDate: typeof r.lastPlayedDate === 'string' ? r.lastPlayedDate : null,
  };
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STATS_KEY);
        if (!cancelled && raw != null) {
          setStats(sanitize(JSON.parse(raw)));
        }
      } catch {
        /* corrupt or unavailable — keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: PlayerStats) => {
    setStats(next);
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
    } catch {
      /* persist failed — in-memory stats still updated for this session */
    }
    return next;
  }, []);

  const recordRun = useCallback(
    async (input: {
      blocksPlaced: number;
      runBestStreak: number;
      perfectsThisRun: number;
    }): Promise<PlayerStats> => {
      const today = todayKey();
      const next: PlayerStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        totalBlocksPlaced: stats.totalBlocksPlaced + Math.max(0, input.blocksPlaced),
        bestStreak: Math.max(stats.bestStreak, Math.max(0, input.runBestStreak)),
        totalPerfects: stats.totalPerfects + Math.max(0, input.perfectsThisRun),
        dailyStreak: nextDailyStreak(stats.dailyStreak, stats.lastPlayedDate, today),
        lastPlayedDate: today,
      };
      return persist(next);
    },
    [stats, persist],
  );

  const resetStats = useCallback(async () => {
    await persist({ ...DEFAULT_STATS });
  }, [persist]);

  return { stats, loading, recordRun, resetStats };
}
