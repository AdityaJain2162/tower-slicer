/**
 * ActiveBlock — the currently moving block.
 *
 * The oscillation runs entirely on the UI thread via Reanimated: a repeating
 * sequence of two withTiming calls that ping-pong the block between the left
 * and right screen bounds. NO setInterval / JS rAF is used. The loop is
 * re-armed whenever direction or cycleMs changes (speed scaling / direction
 * alternation) by keying the effect off those values.
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

import { BLOCK_HEIGHT, HALF_SCREEN_WIDTH, SCREEN } from '@/constants';
import type { ActiveBlockParams } from '@/hooks/useGameEngine';

export interface ActiveBlockProps {
  params: ActiveBlockParams;
  /** SharedValue driving the block's left-edge X (owned by the engine). */
  activeX: SharedValue<number>;
  /** Vertical layer position (same convention as placed blocks). */
  layerY: number;
  playing: boolean;
}

const EASE = Easing.inOut(Easing.quad);

export const ActiveBlock = React.memo(function ActiveBlock({
  params,
  activeX,
  layerY,
  playing,
}: ActiveBlockProps) {
  const { width, color, direction, cycleMs } = params;
  const half = HALF_SCREEN_WIDTH;

  useEffect(() => {
    if (!playing) {
      cancelAnimation(activeX);
      return;
    }
    // Start at the bound matching the travel direction.
    activeX.value = direction === 'ltr' ? -half : half;
    const halfCycle = cycleMs / 2;
    // Ping-pong: ltr goes -half -> +half -> -half; rtl goes +half -> -half -> +half.
    const first = direction === 'ltr' ? half : -half;
    const second = direction === 'ltr' ? -half : half;
    activeX.value = withRepeat(
      withSequence(
        withTiming(first, { duration: halfCycle, easing: EASE }),
        withTiming(second, { duration: halfCycle, easing: EASE }),
      ),
      -1, // infinite
      false,
    );
    return () => cancelAnimation(activeX);
  }, [activeX, direction, cycleMs, half, playing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: layerY }, { translateX: activeX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        {
          left: SCREEN.width / 2,
          width,
          height: BLOCK_HEIGHT,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
});

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    top: 0,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
