/**
 * Background — deep purple-to-dark-blue gradient with a faint geometric grid
 * pattern overlay. Uses expo-linear-gradient for the gradient and a tiled SVG
 * pattern (via a transparent View with border styling) for the grid.
 */
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function Background() {
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={['#1a0b2e', '#0f0f1a', '#0d1b2a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Grid pattern overlay — a grid of thin lines drawn with borders. */}
      <View style={styles.grid}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h${i}`} style={styles.gridRow} />
        ))}
      </View>
      <View style={styles.gridVertical}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`v${i}`} style={styles.gridCol} />
        ))}
      </View>
    </View>
  );
}

const GRID_SIZE = 40;
const GRID_COLOR = 'rgba(255,255,255,0.03)';

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  grid: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'column',
  },
  gridRow: {
    height: GRID_SIZE,
    borderBottomWidth: 1,
    borderBottomColor: GRID_COLOR,
  },
  gridVertical: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  gridCol: {
    width: GRID_SIZE,
    borderRightWidth: 1,
    borderRightColor: GRID_COLOR,
  },
});
