/**
 * Game — composes the engine with all UI: the tap surface (Gesture.Tap for
 * zero-latency input), the Tower, HUD, StartScreen, GameOverModal, the
 * game-over flash + tower shake effects, the floating combo labels, the audio
 * SFX system, the rewarded-ad revive flow, the settings panel, and the
 * persistent stats/settings hooks.
 *
 * The HUD (with its mute toggle), the GameOverModal, and the SettingsPanel
 * are rendered OUTSIDE the GestureDetector so their Pressable buttons receive
 * touches directly instead of being claimed by the stage's Tap gesture.
 *
 * Also manages: fullscreen immersive mode (hides status + nav bars),
 * keep-screen-awake during gameplay, and Android hardware back-button
 * handling (closes settings if open, else confirms exit).
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
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
import { useStats } from '@/hooks/useStats';
import { useSettings } from '@/hooks/useSettings';
import { setHapticsEnabled } from '@/services/haptics';
import { Tower } from './Tower';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { GameOverModal } from './GameOverModal';
import { FloatingComboText } from './FloatingComboText';
import { Background } from './Background';
import { BannerAd } from './BannerAd';
import { SettingsPanel } from './SettingsPanel';

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
  const { stats, loading: statsLoading, recordRun, resetStats } = useStats();
  const { settings, loading: settingsLoading, setSoundEnabled, setHapticsEnabled: setHapticsPref } = useSettings();
  // Keep screen awake while the game is mounted.
  useKeepAwake();

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
    runBlocksPlaced,
    runPerfects,
    runBestStreak,
    start,
    handleTap,
    restart,
    revive,
    goHome,
    removeSlicedPiece,
  } = engine;

  const shakeX = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [floating, setFloating] = useState<FloatingMsg | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Track whether stats for the current run have been recorded (avoid double
  // counting if the game-over effect fires twice or the player revives).
  const [statsRecorded, setStatsRecorded] = useState(false);

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

  // Trigger game-over effects + record stats when entering GAMEOVER.
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
    // Record run stats once per game-over (not on revive).
    if (!statsRecorded) {
      setStatsRecorded(true);
      void recordRun({
        blocksPlaced: runBlocksPlaced,
        runBestStreak,
        perfectsThisRun: runPerfects,
      });
    }
  }, [gameState, shakeX, flashOpacity, score, best, statsRecorded, recordRun, runBlocksPlaced, runBestStreak, runPerfects]);

  // Reset the stats-recorded flag when a new run starts.
  useEffect(() => {
    if (gameState === 'PLAYING' && statsRecorded) {
      setStatsRecorded(false);
    }
  }, [gameState, statsRecorded]);

  // Cancel any lingering shake/flash when leaving GAMEOVER.
  useEffect(() => {
    if (gameState !== 'GAMEOVER') {
      cancelAnimation(shakeX);
      cancelAnimation(flashOpacity);
      shakeX.value = 0;
      flashOpacity.value = 0;
    }
  }, [gameState, shakeX, flashOpacity]);

  // Apply sound setting to the audio hook (mute when disabled).
  useEffect(() => {
    if (!settingsLoading && !settings.soundEnabled && !audio.muted) {
      audio.toggleMute();
    } else if (!settingsLoading && settings.soundEnabled && audio.muted) {
      audio.toggleMute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading, settings.soundEnabled]);

  // Apply haptics setting to the haptics service.
  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);

  // Fullscreen immersive mode — hide status bar + Android navigation bar.
  useEffect(() => {
    // Hide the Android navigation bar on mount (Android only).
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setHidden(true);
        NavigationBar.setStyle('dark');
      } catch {
        // Navigation bar module not available (e.g. Expo Go) — no-op.
      }
    }
    // Restore the nav bar when the app exits / unmounts.
    return () => {
      if (Platform.OS === 'android') {
        try {
          NavigationBar.setHidden(false);
        } catch {
          // no-op
        }
      }
    };
  }, []);

  // Android hardware back-button handling.
  // - If settings panel is open → close it.
  // - Else confirm exit.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (settingsVisible) {
          setSettingsVisible(false);
          return true;
        }
        Alert.alert(
          'Exit Game?',
          'Are you sure you want to quit Tower Slicer?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
        );
        return true; // prevent default back behavior
      },
    );
    return () => subscription.remove();
  }, [settingsVisible]);

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

  const handleResetProgress = useCallback(async () => {
    await resetStats();
    setSettingsVisible(false);
  }, [resetStats]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" hidden={true} />
      <GestureDetector
        gesture={Gesture.Tap().runOnJS(true).onEnd(() => onTap())}
      >
        <Animated.View style={[styles.stage, shakeStyle]}>
          {/* Background — gradient + grid pattern */}
          <Background />

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
            <StartScreen
              best={best}
              bestLoading={bestLoading}
              stats={stats}
              statsLoading={statsLoading}
              onOpenSettings={() => setSettingsVisible(true)}
            />
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
          onHome={goHome}
          runBlocksPlaced={runBlocksPlaced}
          runBestStreak={runBestStreak}
          runPerfects={runPerfects}
        />
      )}

      {/* Settings panel — modal overlay, only meaningful from the start screen. */}
      <SettingsPanel
        visible={settingsVisible}
        settings={settings}
        onClose={() => setSettingsVisible(false)}
        onToggleSound={setSoundEnabled}
        onToggleHaptics={setHapticsPref}
        onResetProgress={handleResetProgress}
      />

      {/* Bottom banner ad (placeholder in Expo Go / web; real ad with dev client) */}
      <View style={styles.bannerWrap}>
        <BannerAd />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  stage: { flex: 1, overflow: 'hidden' },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff3b3b',
  },
  bannerWrap: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
