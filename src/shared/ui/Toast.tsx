import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'error',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!visible) return;

    // Slide in + fade in
    translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
    opacity.value = withTiming(1, { duration: 180 });

    // Auto-dismiss
    const timer = setTimeout(() => {
      translateY.value = withTiming(-16, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(onHide)();
      });
    }, duration);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  if (!visible) return null;

  const isError = type === 'error';
  const bgColor = isError ? colors.errorBackground : colors.warningBg;
  const textColor = isError ? colors.error : colors.warningText;
  const borderColor = isError ? colors.error + '50' : colors.warningBorder;
  const iconName = isError ? 'alert-circle' : 'warning';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: bgColor, borderColor }, animStyle]}
    >
      <Icon name={iconName} size={14} color={textColor} />
      <Text style={[styles.message, { color: textColor }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 12,
    maxWidth: 230,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000', // Intentional: shadow color is always black regardless of theme
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  message: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    lineHeight: 17,
  },
});
