/**
 * useInventory — persistent Neon Shard currency + orb skin unlocks for
 * Orbit Rush: Neon Switch.
 *
 * Shards are the run-collected currency that unlocks vibrant orb skins
 * (Comets, Pulsing Rings, Rainbow Trails, ...). Both the shard balance and
 * the set of unlocked skins are persisted to AsyncStorage so progress
 * survives relaunches.
 *
 * Every storage operation is wrapped in try/catch so a corrupted or
 * unavailable store degrades gracefully to an in-memory copy — the game
 * never crashes because of a bad storage read/write.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHARDS_KEY = '@orbit_rush/shards';
const UNLOCKED_KEY = '@orbit_rush/unlocked_skins';
const ACTIVE_SKIN_KEY = '@orbit_rush/active_skin';

/** A unlockable orb skin. */
export interface OrbSkin {
  /** Stable id, used as the AsyncStorage entry + React key. */
  id: string;
  /** Display name shown in the skin picker. */
  name: string;
  /** Shard cost to unlock. */
  cost: number;
  /** Primary color used by the orb renderer. */
  color: string;
  /** Secondary color (trail / ring accent). */
  accent: string;
  /** Visual style hint consumed by the engine's orb renderer. */
  style: 'solid' | 'comet' | 'pulsing' | 'rainbow';
}

/** Catalog of unlockable skins, ordered by cost. Index 0 is the default. */
export const SKIN_CATALOG: OrbSkin[] = [
  { id: 'classic', name: 'Classic', cost: 0, color: '#7c5cff', accent: '#b8a4ff', style: 'solid' },
  { id: 'comet', name: 'Comet', cost: 50, color: '#4cc9f0', accent: '#a3e1f5', style: 'comet' },
  { id: 'pulsing', name: 'Pulsing Ring', cost: 120, color: '#ff6b6b', accent: '#ffd166', style: 'pulsing' },
  { id: 'rainbow', name: 'Rainbow Trail', cost: 250, color: '#ff6b6b', accent: '#4ade80', style: 'rainbow' },
];

/** Default skin is the free one. */
export const DEFAULT_SKIN_ID = 'classic';

export interface UseInventoryResult {
  /** Current shard balance (0 until the stored value loads). */
  shards: number;
  /** True until the initial AsyncStorage read settles. */
  loading: boolean;
  /** Set of unlocked skin ids (always includes the default). */
  unlockedSkins: string[];
  /** Currently equipped skin id. */
  activeSkin: string;
  /** The active OrbSkin object (resolved from the catalog). */
  activeSkinDef: OrbSkin;
  /** Add shards (e.g. at the end of a run). Persists the new balance. */
  addShards: (amount: number) => Promise<void>;
  /** Spend shards; returns true if the balance was sufficient. */
  spendShards: (amount: number) => Promise<boolean>;
  /** Unlock a skin by id if affordable. Returns true on success. */
  unlockSkin: (skinId: string) => Promise<boolean>;
  /** Equip an already-unlocked skin. Persists the choice. */
  equipSkin: (skinId: string) => Promise<void>;
}

function resolveSkin(id: string): OrbSkin {
  return SKIN_CATALOG.find((s) => s.id === id) ?? SKIN_CATALOG[0];
}

export function useInventory(): UseInventoryResult {
  const [shards, setShards] = useState(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>([DEFAULT_SKIN_ID]);
  const [activeSkin, setActiveSkin] = useState(DEFAULT_SKIN_ID);
  const [loading, setLoading] = useState(true);

  // Load persisted state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let initialShards = 0;
      let initialUnlocked: string[] = [DEFAULT_SKIN_ID];
      let initialActive = DEFAULT_SKIN_ID;
      try {
        const sRaw = await AsyncStorage.getItem(SHARDS_KEY);
        if (sRaw != null) {
          const n = Number(JSON.parse(sRaw));
          if (Number.isFinite(n)) initialShards = Math.max(0, Math.floor(n));
        }
        const uRaw = await AsyncStorage.getItem(UNLOCKED_KEY);
        if (uRaw != null) {
          const parsed = JSON.parse(uRaw) as unknown;
          if (Array.isArray(parsed)) {
            initialUnlocked = parsed.filter(
              (x) => typeof x === 'string' && SKIN_CATALOG.some((s) => s.id === x),
            );
            if (!initialUnlocked.includes(DEFAULT_SKIN_ID)) {
              initialUnlocked = [DEFAULT_SKIN_ID, ...initialUnlocked];
            }
          }
        }
        const aRaw = await AsyncStorage.getItem(ACTIVE_SKIN_KEY);
        if (aRaw != null) {
          const parsed = JSON.parse(aRaw) as unknown;
          if (typeof parsed === 'string' && SKIN_CATALOG.some((s) => s.id === parsed)) {
            initialActive = parsed;
          }
        }
      } catch {
        /* corrupt or unavailable — keep defaults */
      } finally {
        if (cancelled) return;
        setShards(initialShards);
        setUnlockedSkins(initialUnlocked);
        setActiveSkin(initialActive);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistShards = useCallback(async (value: number) => {
    try {
      await AsyncStorage.setItem(SHARDS_KEY, JSON.stringify(value));
    } catch {
      /* no-op: in-memory balance still updates for this session */
    }
  }, []);

  const persistUnlocked = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids));
    } catch {
      /* no-op */
    }
  }, []);

  const addShards = useCallback(
    async (amount: number) => {
      const delta = Math.max(0, Math.floor(amount));
      if (delta <= 0) return;
      setShards((prev) => {
        const next = prev + delta;
        void persistShards(next);
        return next;
      });
    },
    [persistShards],
  );

  const spendShards = useCallback(
    async (amount: number): Promise<boolean> => {
      const cost = Math.max(0, Math.floor(amount));
      if (cost <= 0) return true;
      // Read the latest balance synchronously via the functional update; if
      // insufficient, bail out without persisting.
      let ok = false;
      setShards((prev) => {
        if (prev < cost) return prev;
        ok = true;
        const next = prev - cost;
        void persistShards(next);
        return next;
      });
      return ok;
    },
    [persistShards],
  );

  const unlockSkin = useCallback(
    async (skinId: string): Promise<boolean> => {
      const skin = SKIN_CATALOG.find((s) => s.id === skinId);
      if (!skin) return false;
      if (unlockedSkins.includes(skinId)) return true;
      const spent = await spendShards(skin.cost);
      if (!spent) return false;
      setUnlockedSkins((prev) => {
        const next = [...prev, skinId];
        void persistUnlocked(next);
        return next;
      });
      return true;
    },
    [unlockedSkins, spendShards, persistUnlocked],
  );

  const equipSkin = useCallback(async (skinId: string) => {
    if (!SKIN_CATALOG.some((s) => s.id === skinId)) return;
    setActiveSkin(skinId);
    try {
      await AsyncStorage.setItem(ACTIVE_SKIN_KEY, JSON.stringify(skinId));
    } catch {
      /* no-op */
    }
  }, []);

  return {
    shards,
    loading,
    unlockedSkins,
    activeSkin,
    activeSkinDef: resolveSkin(activeSkin),
    addShards,
    spendShards,
    unlockSkin,
    equipSkin,
  };
}
