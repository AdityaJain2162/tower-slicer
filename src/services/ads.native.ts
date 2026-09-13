/**
 * Native AdMob ads service (iOS / Android).
 *
 * Metro picks this file on native platforms. It requires the native
 * `react-native-google-mobile-ads` module. If the require fails (module not
 * installed) `Ads` is null and useRewardedAd falls back to mock mode. If the
 * require succeeds but the native module isn't linked (e.g. Expo Go without a
 * dev client), the runtime calls inside useRewardedAd throw and are caught,
 * also falling back to mock mode.
 */
let Ads: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Ads = require('react-native-google-mobile-ads');
} catch {
  Ads = null;
}

export { Ads };
