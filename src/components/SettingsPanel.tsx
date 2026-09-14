/**
 * SettingsPanel — overlay with sound + haptics toggles and a reset-progress
 * action. Shown as a modal-style card over the start screen. Uses the same
 * dark theme as the rest of the UI.
 */
import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FONT_BODY_BOLD, FONT_DISPLAY } from '@/hooks/useFonts';
import type { UserSettings } from '@/types';

export interface SettingsPanelProps {
  visible: boolean;
  settings: UserSettings;
  onClose: () => void;
  onToggleSound: (enabled: boolean) => void;
  onToggleHaptics: (enabled: boolean) => void;
  onResetProgress: () => void;
}

export const SettingsPanel = React.memo(function SettingsPanel({
  visible,
  settings,
  onClose,
  onToggleSound,
  onToggleHaptics,
  onResetProgress,
}: SettingsPanelProps) {
  const confirmReset = () => {
    Alert.alert(
      'Reset Progress?',
      'This will erase your best score, stats, and daily streak. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: onResetProgress,
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>SETTINGS</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 20 }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          <ToggleRow
            icon="volume-high"
            label="Sound Effects"
            value={settings.soundEnabled}
            onToggle={onToggleSound}
          />
          <ToggleRow
            icon="phone-portrait"
            label="Haptics"
            value={settings.hapticsEnabled}
            onToggle={onToggleHaptics}
          />

          <Pressable
            style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
            onPress={confirmReset}
            android_ripple={{ color: 'rgba(255,107,107,0.2)', radius: 200 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
            <Text style={styles.resetText}>Reset Progress</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
}

function ToggleRow({ icon, label, value, onToggle }: ToggleRowProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(!value)}
      android_ripple={{ color: 'rgba(255,255,255,0.08)', radius: 200 }}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}>
        <View style={[styles.toggleKnob, value ? styles.knobOn : styles.knobOff]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    letterSpacing: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  rowLabel: {
    flex: 1,
    color: '#fff',
    fontFamily: FONT_BODY_BOLD,
    fontSize: 15,
    marginLeft: 14,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#4ade80',
  },
  toggleOff: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  resetBtnPressed: {
    opacity: 0.85,
  },
  resetText: {
    color: '#ff6b6b',
    fontFamily: FONT_BODY_BOLD,
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 1,
  },
});
