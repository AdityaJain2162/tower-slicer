/**
 * useAudio — SFX system built on expo-av.
 *
 * Pre-loads four short sound effects into memory on mount and unloads them on
 * unmount. Exposes a `play(name)` that re-seeks to 0 before playing so rapid
 * repeats (e.g. consecutive slices) retrigger cleanly. A persistent mute toggle
 * is stored in AsyncStorage so the player's preference survives relaunches.
 *
 * Every Audio operation is wrapped in try/catch so the app keeps running in
 * environments where the native audio module is unavailable (e.g. Expo Go
 * without a dev client, or a corrupt load): play() simply becomes a no-op.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SfxName = 'snap' | 'combo' | 'gameOver' | 'revive';

const MUTE_KEY = '@tower_slicer/muted';

// Static require() so Metro bundles the assets at build time.
const SOUND_ASSETS: Record<SfxName, ReturnType<typeof require>> = {
  snap: require('@/assets/sounds/snap.wav'),
  combo: require('@/assets/sounds/combo.wav'),
  gameOver: require('@/assets/sounds/gameOver.wav'),
  revive: require('@/assets/sounds/revive.wav'),
};

export interface UseAudioResult {
  /** True when the user has muted all SFX. */
  muted: boolean;
  /** True once the initial mute preference has loaded from storage. */
  ready: boolean;
  /** Toggle the persistent mute flag. */
  toggleMute: () => void;
  /** Play a sound effect (no-op when muted or if audio is unavailable). */
  play: (name: SfxName) => void;
}

export function useAudio(): UseAudioResult {
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const soundsRef = useRef<Partial<Record<SfxName, Audio.Sound>>>({});

  // Load persisted mute preference on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(MUTE_KEY);
        if (!cancelled && raw === 'true') setMuted(true);
      } catch {
        /* ignore — default to unmuted */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-load all sounds into memory on mount; unload on unmount.
  useEffect(() => {
    let active = true;
    (async () => {
      for (const name of Object.keys(SOUND_ASSETS) as SfxName[]) {
        try {
          const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[name], {
            shouldPlay: false,
            isLooping: false,
            volume: 1,
          });
          if (!active) {
            await sound.unloadAsync().catch(() => {});
            return;
          }
          soundsRef.current[name] = sound;
        } catch {
          /* sound unavailable — play() will no-op for this name */
        }
      }
    })();

    return () => {
      active = false;
      const sounds = soundsRef.current;
      soundsRef.current = {};
      for (const name of Object.keys(sounds) as SfxName[]) {
        sounds[name]?.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(MUTE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (muted) return;
      const sound = soundsRef.current[name];
      if (!sound) return;
      (async () => {
        try {
          await sound.setPositionAsync(0);
          await sound.playFromPositionAsync(0);
        } catch {
          /* no-op */
        }
      })();
    },
    [muted],
  );

  return { muted, ready, toggleMute, play };
}
