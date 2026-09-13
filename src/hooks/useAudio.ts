/**
 * useAudio — SFX system with platform-aware playback.
 *
 * On native (Expo Go / dev client): uses expo-audio's AudioPlayer.
 * On web: uses the HTML5 Audio API as a fallback so sounds work in
 * the browser too.
 *
 * Pre-loads four short sound effects into memory on mount and unloads them
 * on unmount. Exposes a `play(name)` that re-seeks to 0 before playing so
 * rapid repeats (e.g. consecutive slices) retrigger cleanly. A persistent
 * mute toggle is stored in AsyncStorage so the player's preference survives
 * relaunches.
 *
 * Safety: every audio operation is wrapped in try/catch so the app keeps
 * running in environments where audio is unavailable: play() simply becomes
 * a no-op with a console.warn. The app never crashes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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

/**
 * Resolve a required asset to a URI string usable by HTML5 Audio on web.
 * Metro resolves `require()` to various shapes depending on platform and
 * build mode; this normalizes them to a string URL.
 */
function assetToUri(asset: any): string {
  if (typeof asset === 'string') return asset;
  if (asset?.uri) return asset.uri;
  if (asset?.default) return assetToUri(asset.default);
  // Fallback: stringify in case it's a number or other shape.
  return String(asset);
}

export function useAudio(): UseAudioResult {
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  // Player instances — either expo-audio AudioPlayer or HTML5 Audio.
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

    if (Platform.OS === 'web') {
      // ── Web: use HTML5 Audio API ──────────────────────────────────────
      for (const name of Object.keys(SOUND_ASSETS) as SfxName[]) {
        try {
          const uri = assetToUri(SOUND_ASSETS[name]);
          const audio = new Audio(uri);
          audio.volume = 1;
          audio.preload = 'auto';
          if (!active) return;
          playersRef.current[name] = audio;
        } catch (e) {
          console.warn(`[audio] failed to create web Audio for "${name}":`, e);
        }
      }
      return () => {
        active = false;
        const players = playersRef.current;
        playersRef.current = {};
        for (const name of Object.keys(players) as SfxName[]) {
          try {
            players[name].pause();
            players[name].src = '';
          } catch {
            /* no-op */
          }
        }
      };
    }

    // ── Native: use expo-audio ──────────────────────────────────────────
    (async () => {
      let AudioModule: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const expoAudio = require('expo-audio');
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
        if (Platform.OS === 'web') {
          // HTML5 Audio: seek to start and play.
          player.currentTime = 0;
          player.play().catch(() => { /* autoplay policy — ignore */ });
        } else {
          // expo-audio: seek to start and play.
          player.seekTo(0);
          player.play();
        }
      } catch (e) {
        console.warn(`[audio] failed to play "${name}":`, e);
      }
    },
    [muted],
  );

  return { muted, ready, toggleMute, play };
}
