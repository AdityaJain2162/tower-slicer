/**
 * Logo — a stylized tower/stack icon built from layered rounded rectangles
 * with the game title beneath. No image asset required — pure RN views so
 * it renders identically on every platform and stays crisp at any DPI.
 */
import { StyleSheet, Text, View } from 'react-native';

import { FONT_DISPLAY, FONT_BODY } from '@/hooks/useFonts';

const LAYERS = [
  { width: 88, color: '#ff6b6b' },
  { width: 104, color: '#ffd166' },
  { width: 120, color: '#4ade80' },
  { width: 100, color: '#4cc9f0' },
  { width: 76, color: '#a78bfa' },
];

export function Logo({ size = 1 }: { size?: number }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.tower}>
        {LAYERS.map((layer, i) => (
          <View
            key={i}
            style={[
              styles.block,
              {
                width: layer.width * size,
                backgroundColor: layer.color,
                marginBottom: i === LAYERS.length - 1 ? 0 : 4,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.title, { fontSize: 22 * size }]}>TOWER SLICER</Text>
      <Text style={[styles.subtitle, { fontSize: 12 * size }]}>Stack the perfect tower</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tower: {
    alignItems: 'center',
    marginBottom: 18,
  },
  block: {
    height: 16,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    color: '#fff',
    fontFamily: FONT_DISPLAY,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONT_BODY,
    letterSpacing: 2,
    marginTop: 10,
  },
});
