/**
 * useRewardedAd — Google AdMob Rewarded Video with a safe mock fallback.
 *
 * Preloads a rewarded ad using the official AdMob test unit id
 * (`TestIds.REWARDED`) and exposes `{ isLoaded, showAd }`. When an ad closes
 * (rewarded or dismissed) the next one is automatically reloaded.
 *
 * Safe fallback: in Expo Go or any environment where the native
 * react-native-google-mobile-ads module is unavailable, the hook switches to
 * "mock mode" — `isLoaded` becomes true and `showAd` immediately fires the
 * reward callback. This keeps the revive flow fully testable locally without
 * a dev-client build, and never crashes the app.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ads } from '@/services/ads';

export interface UseRewardedAdResult {
  /** True when an ad is ready to show (or in mock mode). */
  isLoaded: boolean;
  /**
   * Show the rewarded ad. `onReward` is called once the user earns the reward.
   * In mock mode this fires immediately so the revive flow is testable.
   */
  showAd: (onReward: () => void) => void;
}

export function useRewardedAd(): UseRewardedAdResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const adRef = useRef<any>(null);
  const rewardCbRef = useRef<(() => void) | null>(null);
  const mockRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let unsubs: Array<() => void> = [];

    // No native module available -> mock mode (Expo Go / local).
    if (!Ads) {
      mockRef.current = true;
      setIsLoaded(true);
      return;
    }

    const { RewardedAd, RewardedAdEventType, TestIds } = Ads;
    let ad: any;
    try {
      ad = RewardedAd.createForAdRequest(TestIds.REWARDED);
    } catch {
      // Native module present in JS but not linked at runtime -> mock mode.
      mockRef.current = true;
      setIsLoaded(true);
      return;
    }
    adRef.current = ad;

    const load = () => {
      try {
        ad.load();
      } catch {
        mockRef.current = true;
        if (mounted) setIsLoaded(true);
      }
    };

    try {
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (mounted) setIsLoaded(true);
        }),
      );
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          const cb = rewardCbRef.current;
          rewardCbRef.current = null;
          if (cb) cb();
        }),
      );
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
          // Ad dismissed — reload the next one and mark not-ready meanwhile.
          if (mounted) setIsLoaded(false);
          load();
        }),
      );
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.ERROR, () => {
          if (mounted) setIsLoaded(false);
          // Retry after a short delay on error.
          setTimeout(load, 2000);
        }),
      );
    } catch {
      mockRef.current = true;
      if (mounted) setIsLoaded(true);
      return;
    }

    load();

    return () => {
      mounted = false;
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          /* no-op */
        }
      });
      unsubs = [];
    };
  }, []);

  const showAd = useCallback(
    (onReward: () => void) => {
      rewardCbRef.current = onReward;
      if (mockRef.current) {
        // Mock mode: simulate an instant rewarded view.
        const cb = rewardCbRef.current;
        rewardCbRef.current = null;
        if (cb) cb();
        return;
      }
      const ad = adRef.current;
      if (!ad) return;
      try {
        ad.show();
      } catch {
        // Not actually loaded — fall back to mock so the flow still works.
        const cb = rewardCbRef.current;
        rewardCbRef.current = null;
        if (cb) cb();
      }
    },
    [],
  );

  return { isLoaded, showAd };
}
