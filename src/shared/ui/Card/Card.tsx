import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS, type ThemeColors} from '../../config/theme';
import {useCardPressScale} from './card-animations';
import {
  type CardProps,
  type CardHeaderProps,
  type CardBodyProps,
  type CardFooterProps,
  type CardVariant,
  CARD_SIZE_MAP,
} from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  variant = 'elevated',
  size = 'md',
  onPress,
  accessibilityLabel,
  testID,
  style,
  children,
}: CardProps) {
  const {colors, highContrast, isDark} = useTheme();
  const {animatedStyle, onPressIn, onPressOut} = useCardPressScale();
  const sizeConfig = CARD_SIZE_MAP[size];

  const isPressable = variant === 'pressable' && onPress;
  const effectiveVariant =
    highContrast && variant === 'gradient' ? 'filled' : variant;

  const baseStyle = {
    padding: sizeConfig.padding,
    borderRadius: sizeConfig.borderRadius,
    ...getVariantStyle(effectiveVariant, colors, highContrast),
  };

  // Gradient variant
  if (effectiveVariant === 'gradient' && !highContrast) {
    return (
      <LinearGradient
        colors={
          isDark
            ? [colors.accent + '30', colors.surface]
            : [colors.accent + '15', colors.surface]
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[baseStyle, style]}
        testID={testID}>
        {children}
      </LinearGradient>
    );
  }

  // Pressable variant
  if (isPressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[baseStyle, animatedStyle, style]}>
        {children}
      </AnimatedPressable>
    );
  }

  // Static card
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[baseStyle, style]}>
      {children}
    </View>
  );
}

export function CardHeader({icon, title, action}: CardHeaderProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={colors.accent}
            style={styles.headerIcon}
          />
        )}
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.lg,
            fontFamily: FONTS.bold,
            fontWeight: '700',
          }}>
          {title}
        </Text>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

export function CardBody({children, style}: CardBodyProps) {
  return <View style={style}>{children}</View>;
}

export function CardFooter({children}: CardFooterProps) {
  return <View style={styles.footerContainer}>{children}</View>;
}

export function CardDivider() {
  const {colors} = useTheme();
  return (
    <View style={[styles.divider, {backgroundColor: colors.borderLight}]} />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVariantStyle(
  variant: CardVariant,
  colors: ThemeColors,
  highContrast: boolean,
) {
  const base: Record<string, unknown> = {backgroundColor: colors.surface};

  switch (variant) {
    case 'elevated':
      return {
        ...base,
        ...(!highContrast
          ? Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: colors.shadowOpacity,
                shadowRadius: 8,
              },
              android: {elevation: 3},
            })
          : {borderWidth: 2, borderColor: colors.textPrimary}),
      };
    case 'outline':
      return {
        ...base,
        borderWidth: highContrast ? 2 : 1,
        borderColor: highContrast ? colors.textPrimary : colors.border,
      };
    case 'ghost':
      return {backgroundColor: 'transparent'};
    case 'filled':
      return {backgroundColor: colors.accent + '15'};
    case 'pressable':
      return {
        ...base,
        ...(!highContrast
          ? Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: colors.shadowOpacity,
                shadowRadius: 8,
              },
              android: {elevation: 3},
            })
          : {borderWidth: 2, borderColor: colors.textPrimary}),
      };
    default:
      return base;
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
