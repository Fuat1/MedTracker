import React from 'react';
import { View, Text, Pressable, StyleSheet, Vibration, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { useSettingsStore } from '../lib/settings-store';
import { FONTS } from '../config/theme';

interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  compact?: boolean;
}

interface KeyButtonProps {
  keyValue: string;
  keySize: { width: number; height: number };
  disabled: boolean;
  compact: boolean;
  onPress: (key: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

function KeyButton({ keyValue, keySize, disabled, compact, onPress }: KeyButtonProps) {
  const { t } = useTranslation('common');
  const { colors, fontScale } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Haptic feedback - wrapped in try-catch for permission issues
    try {
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      } else if (Platform.OS === 'android') {
        Vibration.vibrate(20);
      }
    } catch (error) {
      // Silently fail if vibration permission not granted
      console.debug('Vibration not available:', error);
    }

    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    onPress(keyValue);
  };

  const isClear = keyValue === 'C';
  const isBackspace = keyValue === '⌫';
  const isAction = isClear || isBackspace;

  return (
    <AnimatedPressable
      style={[
        styles.key,
        {
          width: keySize.width,
          height: keySize.height,
          backgroundColor: isClear
            ? colors.numpadClearBg
            : isBackspace
              ? colors.numpadBackspaceBg
              : colors.numpadKey,
          borderColor: colors.numpadKeyBorder,
          shadowColor: colors.shadow,
          shadowOpacity: colors.shadowOpacity,
        },
        animatedStyle,
        disabled && styles.disabledKey,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        keyValue === '⌫' ? t('a11y.backspace') : keyValue === 'C' ? t('a11y.clear') : keyValue
      }
    >
      <Text
        style={[
          styles.keyText,
          {
            color: colors.numpadKeyText,
            fontSize: compact
              ? (isAction ? 14 * fontScale : 18 * fontScale)
              : (isAction ? 22 * fontScale : 28 * fontScale),
          },
          isClear && { color: colors.error },
          disabled && { color: colors.textTertiary },
        ]}
      >
        {keyValue}
      </Text>
    </AnimatedPressable>
  );
}

export function Numpad({
  value,
  onValueChange,
  maxLength = 3,
  disabled = false,
  compact = false,
}: NumpadProps) {
  const { seniorMode } = useSettingsStore();

  // Dynamic button sizing: compact when category badge is showing
  const keySize = compact
    ? { width: 68, height: 44 }
    : seniorMode
      ? { width: 86, height: 68 }
      : { width: 96, height: 56 };

  const handleKeyPress = (key: string) => {
    if (disabled) {
      return;
    }

    if (key === 'C') {
      // Clear
      onValueChange('');
    } else if (key === '⌫') {
      // Backspace
      onValueChange(value.slice(0, -1));
    } else {
      // Number key
      if (value.length < maxLength) {
        // Prevent leading zeros (except for single 0)
        if (value === '0' && key === '0') {
          return;
        }
        if (value === '0' && key !== '0') {
          onValueChange(key);
        } else {
          onValueChange(value + key);
        }
      }
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, compact && styles.rowCompact]}>
          {row.map((key) => (
            <KeyButton
              key={key}
              keyValue={key}
              keySize={keySize}
              disabled={disabled}
              compact={compact}
              onPress={handleKeyPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// Minimum touch target 48x48dp per accessibility guidelines
const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  containerCompact: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rowCompact: {
    marginBottom: 4,
  },
  key: {
    marginHorizontal: 14,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  keyText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  disabledKey: {
    opacity: 0.4,
  },
});
