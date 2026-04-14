import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, BackHandler } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions like delete */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors, typography, touchTargetSize } = useTheme();

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.88);
  const cardOpacity = useSharedValue(0);

  const backdropAnimStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 240 });
      cardOpacity.value = withTiming(1, { duration: 180 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      cardOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.88, { duration: 150 });
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => handler.remove();
  }, [visible, onCancel]);

  const confirmBg = destructive ? colors.error : colors.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]} />

      {/* Tap-outside-to-cancel */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />

      {/* Card — rendered last so it's above the Pressable */}
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, cardAnimStyle]}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontSize: typography.sm, lineHeight: typography.sm * 1.55 }]}>
            {message}
          </Text>
          <View style={styles.buttons}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, minHeight: touchTargetSize }]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: confirmBg, minHeight: touchTargetSize }]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={[styles.confirmText, { fontSize: typography.sm }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  confirmText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#fff',
  },
});
