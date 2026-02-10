import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

export function Numpad({
  value,
  onValueChange,
  maxLength = 3,
  disabled = false,
}: NumpadProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const pressedKeys = React.useRef<Record<string, Animated.SharedValue<number>>>({});

  const getKeyScale = (key: string) => {
    if (!pressedKeys.current[key]) {
      pressedKeys.current[key] = useSharedValue(1);
    }
    return pressedKeys.current[key];
  };

  const handleKeyPress = (key: string) => {
    if (disabled) {
      return;
    }

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

    // Trigger animation
    const scale = getKeyScale(key);
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

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

  const KeyButton = ({ keyValue }: { keyValue: string }) => {
    const scale = getKeyScale(keyValue);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const isClear = keyValue === 'C';
    const isBackspace = keyValue === '⌫';
    const isAction = isClear || isBackspace;

    return (
      <AnimatedTouchable
        key={keyValue}
        style={[
          styles.key,
          {
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
        onPress={() => handleKeyPress(keyValue)}
        disabled={disabled}
        activeOpacity={0.95}
        accessibilityRole="button"
        accessibilityLabel={
          keyValue === '⌫' ? t('a11y.backspace') : keyValue === 'C' ? t('a11y.clear') : keyValue
        }
      >
        <Text
          style={[
            styles.keyText,
            { color: colors.numpadKeyText },
            isAction && styles.actionKeyText,
            isClear && { color: colors.error },
            disabled && { color: colors.textTertiary },
          ]}
        >
          {keyValue}
        </Text>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <KeyButton key={key} keyValue={key} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Minimum touch target 48x48dp per accessibility guidelines
const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  key: {
    width: 76,
    height: 64,
    marginHorizontal: 8,
    borderRadius: 16,
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
    fontSize: 28,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  actionKeyText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  disabledKey: {
    opacity: 0.4,
  },
});
