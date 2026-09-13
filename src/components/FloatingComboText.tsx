/**
 * FloatingComboText — a "juice" label that scales up, drifts upward, and
 * fades out on the UI thread whenever a combo/perfect/expansion event fires.
 *
 * Driven entirely by Reanimated SharedValues; the parent re-mounts this
 * component (via a `key` derived from the event id) to retrigger the
 * entrance animation.
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface FloatingComboTextProps {
  /** Text to display ("PERFECT!", "TOWER EXPANDED!", ...). */
  text: string;
  /** Accent color for the text. */
  color?: string;
  /** Called once the float-out animation completes (parent unmounts). */
  onDone?: () => void;
}

const SCALE_IN_MS = 140;
const HOLD_MS = 350;
const DRIFT_MS = 450;
const DRIFT_PX = -70;

export function FloatingComboText({
  text,
  color = '#ffd166',
  onDone,
}: FloatingComboTextProps) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Entrance: pop in (scale + fade up), hold, then drift up + fade out.
    scale.value = withSequence(
      withTiming(1.15, { duration: SCALE_IN_MS, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 80 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: SCALE_IN_MS }),
      withDelay(HOLD_MS, withTiming(0, { duration: DRIFT_MS, easing: Easing.in(Easing.quad) })),
    );
    translateY.value = withDelay(
      SCALE_IN_MS,
      withTiming(DRIFT_PX, { duration: HOLD_MS + DRIFT_MS, easing: Easing.out(Easing.cubic) }),
    );
    // Sentinel to fire onDone after the full timeline.
    opacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(1, { duration: SCALE_IN_MS + HOLD_MS + DRIFT_MS }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      }),
    );
  }, [scale, opacity, translateY, onDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Animated.Text style={[styles.text, { color }]}>{text}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
