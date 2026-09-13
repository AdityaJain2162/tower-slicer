/**
 * Tower — the shifting container that holds all placed blocks, the active
 * block, and the falling sliced pieces.
 *
 * The container's translateY is driven by the engine's towerShiftY SharedValue
 * with a smooth withTiming so that after each placement the whole tower glides
 * downward by BLOCK_HEIGHT, keeping the active layer vertically centered.
 * The active layer's anchor is at vertical screen center.
 */
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { BLOCK_HEIGHT, SCREEN } from '@/constants';
import type { ActiveBlockParams } from '@/hooks/useGameEngine';
import type { PlacedBlock, SlicedPiece as SlicedPieceType } from '@/types';
import { ActiveBlock } from './ActiveBlock';
import { Block } from './Block';
import { SlicedPiece } from './SlicedPiece';

export interface TowerProps {
  tower: PlacedBlock[];
  slicedPieces: SlicedPieceType[];
  active: ActiveBlockParams;
  activeX: Animated.SharedValue<number>;
  towerShiftY: Animated.SharedValue<number>;
  playing: boolean;
  onSlicedDone: (id: number) => void;
}

const SHIFT_EASE = Easing.out(Easing.cubic);
const SHIFT_DURATION_MS = 280;

export const Tower = React.memo(function Tower({
  tower,
  slicedPieces,
  active,
  activeX,
  towerShiftY,
  playing,
  onSlicedDone,
}: TowerProps) {
  // Smoothly animate the tower downward whenever towerShiftY changes.
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(towerShiftY.value, {
          duration: SHIFT_DURATION_MS,
          easing: SHIFT_EASE,
        }),
      },
    ],
  }));

  // The active block's vertical layer position uses the same convention as
  // placed blocks: -layer * BLOCK_HEIGHT. Combined with towerShiftY it stays
  // centered.
  const activeLayerY = -active.layer * BLOCK_HEIGHT;

  const handleDone = useCallback(
    (id: number) => onSlicedDone(id),
    [onSlicedDone],
  );

  return (
    <Animated.View
      style={[styles.container, { top: SCREEN.height / 2 }, containerStyle]}
      pointerEvents="none"
    >
      {tower.map((block) => (
        <Block key={block.id} block={block} />
      ))}
      {slicedPieces.map((piece) => (
        <SlicedPiece key={`slice-${piece.id}`} piece={piece} onDone={handleDone} />
      ))}
      <ActiveBlock
        params={active}
        activeX={activeX}
        layerY={activeLayerY}
        playing={playing}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
  },
});
