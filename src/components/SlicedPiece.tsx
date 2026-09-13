/**
 * SlicedPiece — the leftover chunk that falls off the tower after a slice.
 *
 * Animates on the UI thread: gravity-driven fall + rotation, then calls
 * onDone so the parent unmounts it. Pure Reanimated, no JS rAF.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { BLOCK_HEIGHT, SCREEN } from '@/constants';
import type { SlicedPiece as SlicedPieceType } from '@/types';

export interface SlicedPieceProps {
  piece: SlicedPieceType;
  onDone: (id: number) => void;
}

const FALL_DURATION_MS = 650;
const FALL_DISTANCE = SCREEN.height; // well past the bottom edge
const ROTATION_DEG = 90;

export const SlicedPiece = React.memo(function SlicedPiece({
  piece,
  onDone,
}: SlicedPieceProps) {
  const fallY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const done = useSharedValue(0);

  React.useEffect(() => {
    // Kick off the fall + spin on mount, then unmount via onDone.
    fallY.value = withTiming(FALL_DISTANCE, {
      duration: FALL_DURATION_MS,
      easing: Easing.in(Easing.quad), // gravity accelerates
    });
    rotation.value = withTiming(
      piece.side === 'left' ? -ROTATION_DEG : ROTATION_DEG,
      { duration: FALL_DURATION_MS, easing: Easing.out(Easing.quad) },
    );
    // Sentinel animation whose completion triggers unmount.
    done.value = withTiming(1, { duration: FALL_DURATION_MS }, (isFinished) => {
      if (isFinished) runOnJS(onDone)(piece.id);
    });
  }, [fallY, rotation, done, piece.id, piece.side, onDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -piece.layer * BLOCK_HEIGHT + fallY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: SCREEN.width / 2 + piece.x,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
});

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 4,
    opacity: 0.95,
  },
});
