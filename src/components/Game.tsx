/**
 * Game — composes the engine with all UI: the tap surface (Gesture.Tap for
 * zero-latency input), the Tower, HUD, StartScreen, GameOverModal, and the
 * game-over flash + tower shake effects.
 */
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { useGameEngine } from '@/hooks/useGameEngine';
import { Tower } from './Tower';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { GameOverModal } from './GameOverModal';

const SHAKE_DURATION_MS = 50;
const SHAKE_COUNT = 6;
const SHAKE_AMP = 6;
const FLASH_DURATION_MS = 350;

export default function Game() {
  const engine = useGameEngine();
  const {
    gameState,
    score,
    streak,
    best,
    bestLoading,
    tower,
    slicedPieces,
    active,
    activeX,
    towerShiftY,
    start,
    handleTap,
    restart,
    removeSlicedPiece,
  } = engine;

  const shakeX = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const onTap = useCallback(() => {
    if (gameState === 'IDLE') {
      start();
    } else if (gameState === 'PLAYING') {
      handleTap();
    }
  }, [gameState, start, handleTap]);

  // Trigger game-over effects when entering GAMEOVER.
  useEffect(() => {
    if (gameState !== 'GAMEOVER') return;
    // Tower shake.
    shakeX.value = withSequence(
      ...Array(SHAKE_COUNT).fill(0).map((_, i) =>
        withTiming((i % 2 === 0 ? 1 : -1) * SHAKE_AMP, {
          duration: SHAKE_DURATION_MS,
          easing: Easing.linear,
        }),
      ),
      withTiming(0, { duration: SHAKE_DURATION_MS }),
    );
    // Red screen flash.
    flashOpacity.value = withSequence(
      withTiming(0.5, { duration: 80 }),
      withTiming(0, { duration: FLASH_DURATION_MS }),
    );
    setIsNewBest(score > 0 && score >= best);
  }, [gameState, shakeX, flashOpacity, score, best]);

  // Cancel any lingering shake/flash when leaving GAMEOVER.
  useEffect(() => {
    if (gameState !== 'GAMEOVER') {
      cancelAnimation(shakeX);
      cancelAnimation(flashOpacity);
      shakeX.value = 0;
      flashOpacity.value = 0;
    }
  }, [gameState, shakeX, flashOpacity]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <GestureDetector
        gesture={Gesture.Tap().runOnJS(true).onEnd(() => onTap())}
      >
        <Animated.View style={[styles.stage, shakeStyle]}>
          {/* Background */}
          <View style={styles.background} />

          <Tower
            tower={tower}
            slicedPieces={slicedPieces}
            active={active}
            activeX={activeX}
            towerShiftY={towerShiftY}
            playing={gameState === 'PLAYING'}
            onSlicedDone={removeSlicedPiece}
          />

          {gameState === 'PLAYING' && <HUD score={score} streak={streak} />}
          {gameState === 'IDLE' && (
            <StartScreen best={best} bestLoading={bestLoading} />
          )}

          {/* Game-over red flash */}
          <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
        </Animated.View>
      </GestureDetector>

      {gameState === 'GAMEOVER' && (
        <GameOverModal
          score={score}
          best={best}
          isNewBest={isNewBest}
          onRestart={restart}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  stage: { flex: 1, overflow: 'hidden' },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f1a',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff3b3b',
  },
});
