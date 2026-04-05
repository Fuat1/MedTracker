import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { useSettingsStore } from '../lib/settings-store';
import { hapticKeystroke } from '../lib/haptics';
import { FONTS } from '../config/theme';

interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  compact?: boolean;
  allowDecimal?: boolean;
  /** Override layout; defaults to user's stored preference */
  layout?: 'calculator' | 'telephone';
}

interface KeyButtonProps {
  keyValue: string;
  keySize: { width: number; height: number };
  disabled: boolean;
  compact: boolean;
  onPress: (key: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Telephone layout: 1-2-3 top row (legacy default)
const TELEPHONE_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

// Calculator layout: 7-8-9 top row (SM-007 default)
const CALCULATOR_KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '⌫'],
];

function KeyButton({ keyValue, keySize, disabled, compact, onPress }: KeyButtonProps) {
  const { t } = useTranslation('common');
  const { colors, fontScale, highContrast } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    hapticKeystroke();

    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    onPress(keyValue);
  };

  const isClear = keyValue === 'C';
  const isBackspace = keyValue === '⌫';

  return (
    <AnimatedPressable
      style={[
        styles.key,
        {
          height: keySize.height,
          backgroundColor: isClear
            ? colors.numpadClearBg
            : isBackspace
              ? colors.numpadBackspaceBg
              : colors.numpadKey,
          borderColor: colors.numpadKeyBorder,
          borderWidth: highContrast ? colors.borderWidth : 1,
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
              ? (isClear || isBackspace ? 20 * fontScale : 26 * fontScale)
              : (isClear || isBackspace ? 26 * fontScale : 32 * fontScale),
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
  allowDecimal = false,
  layout,
}: NumpadProps) {
  const { seniorMode, numpadLayout } = useSettingsStore();
  const effectiveLayout = layout ?? numpadLayout;

  const keySize = compact
    ? seniorMode
      ? { width: 76, height: 58 }
      : { width: 84, height: 50 }
    : seniorMode
      ? { width: 94, height: 72 }
      : { width: 104, height: 62 };

  const baseKeys = effectiveLayout === 'telephone' ? TELEPHONE_KEYS : CALCULATOR_KEYS;

  // Decimal mode: replace 'C' with '.' in bottom row
  const keys = allowDecimal
    ? baseKeys.map((row, i) =>
        i === 3 ? ['.', '0', '⌫'] : row
      )
    : baseKeys;

  const handleKeyPress = (key: string) => {
    if (disabled) return;

    if (key === 'C') {
      onValueChange('');
    } else if (key === '⌫') {
      onValueChange(value.slice(0, -1));
    } else if (key === '.') {
      if (value === '' || value.includes('.')) return;
      if (value.length < maxLength) onValueChange(value + '.');
    } else {
      if (value.length < maxLength) {
        if (value === '0' && key === '0') return;
        if (value === '0' && key !== '0') onValueChange(key);
        else onValueChange(value + key);
      }
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {keys.map((row, rowIndex) => (
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

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  containerCompact: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  rowCompact: {
    marginBottom: 10,
  },
  key: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  keyText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  disabledKey: {
    opacity: 0.4,
  },
});
