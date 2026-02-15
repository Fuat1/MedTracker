import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface SaveButtonProps {
  label: string;
  isValid: boolean;
  isLoading: boolean;
  onPress: () => void;
  fontScale?: number;
}

export function SaveButton({ label, isValid, isLoading, onPress, fontScale = 1 }: SaveButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.button, { backgroundColor: isValid ? colors.accent : colors.border }]}
      onPress={onPress}
      disabled={!isValid || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isValid || isLoading }}
    >
      <Icon name="checkmark-circle" size={20} color={colors.surface} />
      <Text style={[styles.buttonText, { fontSize: 16 * fontScale, color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
