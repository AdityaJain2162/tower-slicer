/**
 * useAudio — SFX system built on expo-audio (the modern replacement for
 * expo-av, which was removed in SDK 54+).
 *
 * Pre-loads four short sound effects into memory on mount and unloads them
 * on unmount. Exposes a `play(name)` that re-seeks to 0 before playing so
 * rapid repeats (e.g. consecutive slices) retrigger cleanly. A persistent
 * mute toggle is stored in AsyncStorage so the player's preference survives
 * relaunches.
 *
 * Safety: every Audio operation is wrapped in try/catch so the app keeps
 * running in environments where the native audio module is unavailable
 * (e.g. Expo Go without the module, or a corrupt load): play() simply
 * becomes a no-op with a console.warn. The app never crashes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
  // AudioPlayer instances (expo-audio). Typed as any to avoid coupling this
  // file to the native types, which may not resolve in all environments.
  const playersRef = useRef<Partial<Record<SfxName, any>>>({});
  const audioAvailableRef = useRef(true);

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
      // Dynamically import expo-audio so the file doesn't crash at import
      // time if the module is unavailable. In Expo Go SDK 57+ expo-audio is
      // bundled, but this guard makes the hook robust in any environment.
      let AudioModule: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expoAudio = require('expo-audio');
        // The AudioPlayer class lives on the default export's AudioModule.
        AudioModule = expoAudio.default || expoAudio.AudioModule || expoAudio;
      } catch {
        console.warn('[audio] expo-audio module not available — sounds will be silent');
        audioAvailableRef.current = false;
        return;
      }

      const AudioPlayerCtor = AudioModule?.AudioPlayer;
      if (typeof AudioPlayerCtor !== 'function') {
        console.warn('[audio] AudioPlayer not available — sounds will be silent');
        audioAvailableRef.current = false;
        return;
      }

      for (const name of Object.keys(SOUND_ASSETS) as SfxName[]) {
        try {
          // Constructor signature: (source, updateInterval, keepAudioSessionActive, preferredForwardBufferDuration)
          const player = new AudioPlayerCtor(SOUND_ASSETS[name], 500, false, 0);
          player.volume = 1;
          if (!active) {
            try { player.release(); } catch { /* no-op */ }
            return;
          }
          playersRef.current[name] = player;
        } catch (e) {
          console.warn(`[audio] failed to create player for "${name}":`, e);
        }
      }
    })();

    return () => {
      active = false;
      const players = playersRef.current;
      playersRef.current = {};
      for (const name of Object.keys(players) as SfxName[]) {
        try {
          players[name]?.release();
        } catch {
          /* no-op */
        }
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
      if (!audioAvailableRef.current) return;
      const player = playersRef.current[name];
      if (!player) return;
      try {
        // Seek to start and play. expo-audio uses seekTo() + play().
        player.seekTo(0);
        player.play();
      } catch (e) {
        console.warn(`[audio] failed to play "${name}":`, e);
      }
    },
    [muted],
  );

  return { muted, ready, toggleMute, play };
}
