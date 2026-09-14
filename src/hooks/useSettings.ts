/**
 * useSettings — persisted user settings via AsyncStorage.
 *
 * Tracks sound + haptics preferences. Both default to enabled. Every
 * AsyncStorage operation is wrapped in try/catch so a corrupted/unavailable
 * store degrades gracefully to in-memory defaults.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SETTINGS_KEY } from '@/constants/game';
import type { UserSettings } from '@/types';

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
};

export interface UseSettingsResult {
  settings: UserSettings;
  loading: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  resetSettings: () => Promise<void>;
}

function sanitize(raw: unknown): UserSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const r = raw as Partial<UserSettings>;
  return {
    soundEnabled: typeof r.soundEnabled === 'boolean' ? r.soundEnabled : true,
    hapticsEnabled: typeof r.hapticsEnabled === 'boolean' ? r.hapticsEnabled : true,
  };
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!cancelled && raw != null) {
          setSettings(sanitize(JSON.parse(raw)));
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

  const persist = useCallback(async (next: UserSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* persist failed — in-memory settings still updated for this session */
    }
    return next;
  }, []);

  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      persist({ ...settings, soundEnabled: enabled });
    },
    [settings, persist],
  );

  const setHapticsEnabled = useCallback(
    (enabled: boolean) => {
      persist({ ...settings, hapticsEnabled: enabled });
    },
    [settings, persist],
  );

  const resetSettings = useCallback(async () => {
    await persist({ ...DEFAULT_SETTINGS });
  }, [persist]);

  return { settings, loading, setSoundEnabled, setHapticsEnabled, resetSettings };
}
