/**
 * Orbit Rush Ad Manager — resilient rewarded-ad service with a safe
 * Expo Go / sandbox mock fallback.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SEPARATE FILE FROM `ads.ts` / `ads.native.ts`
 *
 * The repo uses a platform split for the *raw* AdMob module:
 *   - `ads.ts`        → web stub (`Ads = null`)
 *   - `ads.native.ts` → native `require('react-native-google-mobile-ads')`
 *
 * Metro picks `ads.native.ts` on native and `ads.ts` on web, so the
 * native-only AdMob module is NEVER bundled into the web build. This Ad
 * Manager lives in a cross-platform file (`adManager.ts`, no `.native`
 * variant) and imports the `Ads` symbol from `./ads`, which resolves to
 * the correct platform variant. That gives us:
 *   - one implementation of the manager (no duplication),
 *   - the same safe mock fallback on web + Expo Go + dev-client-less native,
 *   - no native module pulled into the web bundle.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Behavior:
 *  - `loadRewardedAd()` preloads a rewarded ad. If the native AdMob module
 *    is absent (Expo Go / web / sandbox) it flips into mock mode and reports
 *    ready immediately.
 *  - `showRewardedReviveAd(onSuccess)` / `showRewardedDoubleCurrency(onSuccess)`
 *    show the ad. In mock mode they simulate a 2-second ad, surface a
 *    temporary "MOCK AD" badge (via `subscribeMockBadge`), then fire
 *    `onSuccess`. The app NEVER crashes when the native module is missing.
 *
 * Google test ad unit IDs are used by default (see `src/config/ads.ts`).
 */
import { Platform } from 'react-native';

import { Ads } from './ads';
import { REWARDED_AD_ID } from '@/config/ads';

export type AdPurpose = 'revive' | 'doubleCurrency';

/** Callback fired once the user earns the reward. */
export type RewardCallback = () => void;

/** True when running without the native AdMob module (mock mode). */
export function isMockMode(): boolean {
  return Ads === null || Ads === undefined;
}

// ── Mock badge pub/sub ─────────────────────────────────────────────────────
// In mock mode we surface a temporary "MOCK AD" badge so testers can see
// the simulated ad is "playing". Components subscribe to toggle it.
type BadgeListener = (visible: boolean) => void;
const badgeListeners = new Set<BadgeListener>();

/** Subscribe to mock-badge visibility changes. Returns an unsubscribe fn. */
export function subscribeMockBadge(listener: BadgeListener): () => void {
  badgeListeners.add(listener);
  return () => {
    badgeListeners.delete(listener);
  };
}

function setMockBadgeVisible(visible: boolean) {
  badgeListeners.forEach((l) => {
    try {
      l(visible);
    } catch {
      /* no-op: a bad listener must never break the ad flow */
    }
  });
}

// ── Ad instance + readiness state ──────────────────────────────────────────
let rewardedAd: any = null;
let loaded = false;
let loading = false;
const pendingCallbacks = new Map<AdPurpose, RewardCallback>();

/**
 * Preload a rewarded ad. Safe to call multiple times; concurrent loads are
 * coalesced. In mock mode this resolves immediately and marks the ad ready.
 */
export function loadRewardedAd(): Promise<void> {
  if (loaded || loading) return Promise.resolve();
  if (isMockMode()) {
    loaded = true;
    return Promise.resolve();
  }

  loading = true;
  return new Promise<void>((resolve) => {
    try {
      const { RewardedAd, RewardedAdEventType } = Ads;
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_ID);
      rewardedAd = ad;

      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        loading = false;
        loaded = ok;
        resolve();
      };

      ad.addAdEventListener(RewardedAdEventType.LOADED, () => finish(true));
      ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
        // Load failed — drop into mock mode so the flow still works.
        rewardedAd = null;
        loaded = true; // mock-ready
        loading = false;
        resolve();
      });
      ad.load();
      // Safety timeout so a hung load never blocks the UI forever.
      setTimeout(() => finish(loaded), 5000);
    } catch {
      // createForAdRequest threw (native not linked at runtime) → mock mode.
      rewardedAd = null;
      loaded = true;
      loading = false;
      resolve();
    }
  });
}

/** True when an ad is ready to show (real or mock). */
export function isRewardedAdLoaded(): boolean {
  return loaded;
}

function runMockAd(purpose: AdPurpose, onSuccess: RewardCallback) {
  pendingCallbacks.set(purpose, onSuccess);
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line no-console
    console.info(`[ads] mock rewarded ad (${purpose}) — reward in 2s`);
  }
  setMockBadgeVisible(true);
  setTimeout(() => {
    setMockBadgeVisible(false);
    const cb = pendingCallbacks.get(purpose);
    pendingCallbacks.delete(purpose);
    if (cb) {
      try {
        cb();
      } catch {
        /* no-op: a throwing reward callback must not break the manager */
      }
    }
  }, 2000);
}

function showRealAd(purpose: AdPurpose, onSuccess: RewardCallback) {
  const ad = rewardedAd;
  if (!ad) {
    runMockAd(purpose, onSuccess);
    return;
  }
  pendingCallbacks.set(purpose, onSuccess);

  try {
    const { RewardedAdEventType } = Ads;
    // One-shot reward listener for this show.
    const earnedSub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      const cb = pendingCallbacks.get(purpose);
      pendingCallbacks.delete(purpose);
      if (cb) {
        try {
          cb();
        } catch {
          /* no-op */
        }
      }
    });
    const closedSub = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      try { earnedSub(); } catch { /* no-op */ }
      try { closedSub(); } catch { /* no-op */ }
      // Reload the next ad for next time.
      loaded = false;
      rewardedAd = null;
      void loadRewardedAd();
    });
    ad.show();
  } catch {
    // show() threw (not actually loaded) — fall back to mock so the flow
    // still completes.
    runMockAd(purpose, onSuccess);
  }
}

/**
 * Show the rewarded ad used for the "Second Chance" revive. `onSuccess` is
 * fired once the reward is earned. In mock mode this simulates a 2-second
 * ad with a temporary badge, then fires the callback.
 */
export function showRewardedReviveAd(onSuccess: RewardCallback): void {
  if (isMockMode() || !rewardedAd) {
    runMockAd('revive', onSuccess);
    return;
  }
  showRealAd('revive', onSuccess);
}

/**
 * Show the rewarded ad used for "2x Shards" at game over. Same mock fallback
 * as the revive ad.
 */
export function showRewardedDoubleCurrency(onSuccess: RewardCallback): void {
  if (isMockMode() || !rewardedAd) {
    runMockAd('doubleCurrency', onSuccess);
    return;
  }
  showRealAd('doubleCurrency', onSuccess);
}
