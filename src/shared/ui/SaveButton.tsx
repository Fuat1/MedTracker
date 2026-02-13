import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
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
    <TouchableOpacity
      style={[styles.button, { backgroundColor: isValid ? colors.accent : colors.border }]}
      onPress={onPress}
      disabled={!isValid || isLoading}
      activeOpacity={0.85}
    >
      <Icon name="checkmark-circle" size={20} color="#ffffff" />
      <Text style={[styles.buttonText, { fontSize: 16 * fontScale }]}>{label}</Text>
    </TouchableOpacity>
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
    color: '#ffffff',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
