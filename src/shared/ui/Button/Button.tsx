import React, { createContext, useContext } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../lib/use-theme';
import { FONTS, type ThemeColors } from '../../config/theme';
import { usePressScale } from './button-animations';
import {
  type ButtonProps,
  type ButtonTextProps,
  type ButtonIconProps,
  type ButtonSpinnerProps,
  type ButtonVariant,
  type ButtonSize,
  BUTTON_SIZE_MAP,
} from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Context to pass variant styling down to sub-components
interface ButtonContextValue {
  variant: ButtonVariant;
  size: ButtonSize;
  textColor: string;
  iconSize: number;
  fontSize: number;
}
const ButtonContext = createContext<ButtonContextValue>({
  variant: 'primary',
  size: 'md',
  textColor: '#ffffff',
  iconSize: 20,
  fontSize: 16,
});

export function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  isLoading = false,
  isDisabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  children,
}: ButtonProps) {
  const { colors, typography, highContrast } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(
    variant === 'fab' ? 0.92 : 0.96,
  );
  const sizeConfig = BUTTON_SIZE_MAP[size];
  const disabled = isDisabled || isLoading;

  // Resolve colors by variant
  const bgColor = getBackgroundColor(variant, colors, disabled);
  const textColor = getTextColor(variant, colors, disabled);
  const borderColor = getBorderColor(variant, colors, highContrast);

  const containerStyle: ViewStyle = {
    backgroundColor: bgColor,
    minHeight: sizeConfig.minHeight,
    paddingHorizontal:
      variant === 'icon' || variant === 'fab' ? 0 : sizeConfig.paddingH,
    paddingVertical: variant === 'link' ? 0 : sizeConfig.paddingV,
    borderRadius:
      variant === 'fab' || variant === 'icon'
        ? sizeConfig.minHeight / 2
        : 12,
    borderWidth: borderColor ? (highContrast ? 2 : 1) : 0,
    borderColor: borderColor || 'transparent',
    width:
      variant === 'fab' || variant === 'icon'
        ? sizeConfig.minHeight
        : undefined,
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'fab'
      ? {
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            },
            android: { elevation: 6 },
          }),
        }
      : {}),
  };

  const fontSize =
    variant === 'link' ? typography.sm : typography[sizeToTypography(size)];

  return (
    <ButtonContext.Provider
      value={{ variant, size, textColor, iconSize: sizeConfig.iconSize, fontSize }}>
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, busy: isLoading }}
        testID={testID}
        style={[
          styles.container,
          containerStyle,
          animatedStyle,
          style,
        ]}
        hitSlop={
          sizeConfig.minHeight < 44
            ? {
                top: (44 - sizeConfig.minHeight) / 2,
                bottom: (44 - sizeConfig.minHeight) / 2,
              }
            : undefined
        }>
        {isLoading ? (
          <ActivityIndicator
            color={textColor}
            size="small"
            testID={testID ? `${testID}-spinner` : undefined}
          />
        ) : (
          children
        )}
      </AnimatedPressable>
    </ButtonContext.Provider>
  );
}

export function ButtonText({ children }: ButtonTextProps) {
  const { variant, textColor, fontSize } = useContext(ButtonContext);
  return (
    <Text
      style={[
        styles.text,
        {
          color: textColor,
          fontSize,
          textDecorationLine: variant === 'link' ? 'underline' : 'none',
        },
      ]}>
      {children}
    </Text>
  );
}

export function ButtonIcon({ as: IconComponent, name }: ButtonIconProps) {
  const { textColor, iconSize } = useContext(ButtonContext);
  return <IconComponent name={name} size={iconSize} color={textColor} />;
}

export function ButtonSpinner({ color, size = 'small' }: ButtonSpinnerProps) {
  const { textColor } = useContext(ButtonContext);
  return <ActivityIndicator color={color || textColor} size={size} />;
}

// --- Helpers ----------------------------------------------------------------

function getBackgroundColor(
  variant: ButtonVariant,
  colors: ThemeColors,
  disabled: boolean,
): string {
  if (disabled && variant === 'primary') {
    return colors.border;
  }
  switch (variant) {
    case 'primary':
      return colors.accent;
    case 'destructive':
      return colors.error;
    case 'secondary':
    case 'ghost':
    case 'link':
      return 'transparent';
    case 'icon':
      return 'transparent';
    case 'fab':
      return colors.accent;
    default:
      return colors.accent;
  }
}

function getTextColor(
  variant: ButtonVariant,
  colors: ThemeColors,
  disabled: boolean,
): string {
  if (disabled) {
    return colors.textSecondary;
  }
  switch (variant) {
    case 'primary':
    case 'fab':
      return colors.surface;
    case 'destructive':
      return colors.surface;
    case 'secondary':
      return colors.accent;
    case 'ghost':
      return colors.textPrimary;
    case 'icon':
      return colors.textPrimary;
    case 'link':
      return colors.accent;
    default:
      return colors.surface;
  }
}

function getBorderColor(
  variant: ButtonVariant,
  colors: ThemeColors,
  highContrast: boolean,
): string | null {
  if (variant === 'secondary') {
    return colors.accent;
  }
  if (highContrast && variant !== 'ghost' && variant !== 'link') {
    return colors.textPrimary;
  }
  return null;
}

function sizeToTypography(size: ButtonSize): 'sm' | 'md' | 'lg' {
  return size;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
