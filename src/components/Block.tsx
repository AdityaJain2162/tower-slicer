/**
 * Block — a permanently placed block in the tower.
 *
 * Positioned absolutely within the tower container. Vertical position is
 * derived from its layer (each layer is one BLOCK_HEIGHT above the previous);
 * horizontal position comes from the block's left-edge X. The container's
 * own translateY (towerShiftY) is applied by the parent, so this component
 * only needs a static style.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { BLOCK_HEIGHT, SCREEN } from '@/constants';
import type { PlacedBlock } from '@/types';

export interface BlockProps {
  block: PlacedBlock;
}

export const Block = React.memo(function Block({ block }: BlockProps) {
  // Vertical offset within the container: layer 0 at the bottom, higher layers
  // stack upward (negative Y). Combined with the parent's towerShiftY this
  // keeps the active layer centered.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -block.layer * BLOCK_HEIGHT }],
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        {
          left: SCREEN.width / 2 + block.x,
          width: block.width,
          height: block.height,
          backgroundColor: block.color,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
