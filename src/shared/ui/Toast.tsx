import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!visible) return;

    // Slide in + fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -16,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
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
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
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
