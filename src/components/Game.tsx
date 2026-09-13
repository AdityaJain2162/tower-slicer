/**
 * Game — composes the engine with all UI: the tap surface (Gesture.Tap for
 * zero-latency input), the Tower, HUD, StartScreen, GameOverModal, the
 * game-over flash + tower shake effects, the floating combo labels, the audio
 * SFX system, and the rewarded-ad revive flow.
 *
 * The HUD (with its mute toggle) and the GameOverModal are rendered OUTSIDE
 * the GestureDetector so their Pressable buttons receive touches directly
 * instead of being claimed by the stage's Tap gesture.
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
import { useAudio } from '@/hooks/useAudio';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { Tower } from './Tower';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { GameOverModal } from './GameOverModal';
import { FloatingComboText } from './FloatingComboText';

const SHAKE_DURATION_MS = 50;
const SHAKE_COUNT = 6;
const SHAKE_AMP = 6;
const FLASH_DURATION_MS = 350;

interface FloatingMsg {
  id: number;
  text: string;
  color: string;
}

export default function Game() {
  const engine = useGameEngine();
  const audio = useAudio();
  const { isLoaded: adLoaded, showAd } = useRewardedAd();

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
    lastEvent,
    hasRevived,
    start,
    handleTap,
    restart,
    revive,
    removeSlicedPiece,
  } = engine;

  const shakeX = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [floating, setFloating] = useState<FloatingMsg | null>(null);

  const onTap = useCallback(() => {
    if (gameState === 'IDLE') {
      start();
    } else if (gameState === 'PLAYING') {
      handleTap();
    }
  }, [gameState, start, handleTap]);

  // React to engine events: play SFX + show floating combo labels.
  useEffect(() => {
    if (!lastEvent) return;
    switch (lastEvent.type) {
      case 'hit':
        audio.play('snap');
        break;
      case 'perfect':
        audio.play('combo');
        setFloating({ id: lastEvent.id, text: 'PERFECT!', color: '#ffd166' });
        break;
      case 'expansion':
        audio.play('combo');
        setFloating({ id: lastEvent.id, text: 'TOWER EXPANDED!', color: '#4ade80' });
        break;
      case 'miss':
        audio.play('gameOver');
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  // Trigger game-over effects when entering GAMEOVER.
  useEffect(() => {
    if (gameState !== 'GAMEOVER') return;
    // Tower shake: ±6px alternating with decay, then settle.
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

  const handleRevive = useCallback(() => {
    showAd(() => {
      revive();
      audio.play('revive');
    });
  }, [showAd, revive, audio]);

  const canRevive = !hasRevived && adLoaded;

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

          {gameState === 'IDLE' && (
            <StartScreen best={best} bestLoading={bestLoading} />
          )}

          {/* Game-over red flash */}
          <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
        </Animated.View>
      </GestureDetector>

      {/* Floating combo text — outside the shake so it stays readable. */}
      {floating && gameState === 'PLAYING' && (
        <FloatingComboText
          key={floating.id}
          text={floating.text}
          color={floating.color}
          onDone={() => setFloating(null)}
        />
      )}

      {/* HUD rendered outside the GestureDetector so the mute button taps work. */}
      {gameState === 'PLAYING' && (
        <HUD
          score={score}
          streak={streak}
          muted={audio.muted}
          onToggleMute={audio.toggleMute}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <GameOverModal
          score={score}
          best={best}
          isNewBest={isNewBest}
          canRevive={canRevive}
          onRestart={restart}
          onRevive={handleRevive}
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
