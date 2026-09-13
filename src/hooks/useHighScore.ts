/**
 * useHighScore — persisted personal-best score via AsyncStorage.
 *
 * Loads the stored best on mount and exposes a `submitScore` that updates it
 * only when beaten. Every AsyncStorage operation is wrapped in try/catch so
 * a corrupted/unavailable store degrades gracefully to an in-memory best.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HIGH_SCORE_KEY } from '@/constants/game';
import type { HighScoreRecord } from '@/types';

export interface UseHighScoreResult {
  /** Current known personal best (0 until the stored value loads). */
  best: number;
  /** True until the initial AsyncStorage read settles. */
  loading: boolean;
  /**
   * Record a run's score. Returns true if it became the new best.
   * Persists the new best to AsyncStorage when beaten.
   */
  submitScore: (score: number) => Promise<boolean>;
  /** Manually reset the stored best (e.g. for a debug "clear scores" action). */
  resetBest: () => Promise<void>;
}

export function useHighScore(): UseHighScoreResult {
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load persisted best on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (cancelled) return;
        if (raw != null) {
          const parsed = JSON.parse(raw) as HighScoreRecord;
          if (typeof parsed.best === 'number' && Number.isFinite(parsed.best)) {
            setBest(Math.max(0, Math.floor(parsed.best)));
          }
        }
      } catch {
        /* corrupt or unavailable — keep best = 0 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitScore = useCallback(
    async (score: number): Promise<boolean> => {
      const candidate = Math.max(0, Math.floor(score));
      if (candidate <= best) return false;
      setBest(candidate);
      try {
        const record: HighScoreRecord = { best: candidate };
        await AsyncStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(record));
      } catch {
        /* persist failed — in-memory best still updated for this session */
      }
      return true;
    },
    [best],
  );

  const resetBest = useCallback(async () => {
    setBest(0);
    try {
      await AsyncStorage.removeItem(HIGH_SCORE_KEY);
    } catch {
      /* no-op */
    }
  }, []);

  return { best, loading, submitScore, resetBest };
}
