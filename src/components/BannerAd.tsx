/**
 * BannerAd — a bottom-of-screen banner ad with a safe placeholder fallback.
 *
 * On native with a dev client, it renders a real AdMob banner using the ad
 * unit ID from `src/config/ads.ts`. In Expo Go / web / environments without
 * the native module, it renders a styled placeholder box so the layout is
 * preserved and you can see where the ad will appear.
 */
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ads } from '@/services/ads';
import { BANNER_AD_ID } from '@/config/ads';

export function BannerAd() {
  // Web or no native module → placeholder.
  if (!Ads || Platform.OS === 'web') {
    return (
      <View style={styles.placeholder} pointerEvents="none">
        <Text style={styles.placeholderText}>Ad Banner Placeholder</Text>
      </View>
    );
  }

  // Native with dev client → real AdMob banner.
  // Check that BannerAd and BannerAdSize actually exist before rendering —
  // in Expo Go the module may be requireable but the native view isn't
  // linked, so BannerAd would be undefined and crash on render.
  const { BannerAd, BannerAdSize } = Ads;
  if (typeof BannerAd !== 'function' || !BannerAdSize) {
    return (
      <View style={styles.placeholder} pointerEvents="none">
        <Text style={styles.placeholderText}>Ad Banner Placeholder</Text>
      </View>
    );
  }

  try {
    return (
      <View style={styles.container}>
        <BannerAd
          unitId={BANNER_AD_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{}}
        />
      </View>
    );
  } catch {
    // BannerView not available → placeholder.
    return (
      <View style={styles.placeholder} pointerEvents="none">
        <Text style={styles.placeholderText}>Ad Banner Placeholder</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  placeholder: {
    width: 320,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,40,0.85)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120,130,255,0.6)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: 'rgba(200,210,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
