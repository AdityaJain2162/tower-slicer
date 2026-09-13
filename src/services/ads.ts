/**
 * Web fallback for the AdMob ads service.
 *
 * Metro picks this file on web (over ads.native.ts) so the native-only
 * `react-native-google-mobile-ads` module is never bundled for web. `Ads` is
 * null, which makes useRewardedAd fall back to mock mode.
 */
export const Ads: any = null;
