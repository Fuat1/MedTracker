import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const { colors, touchTargetSize, typography, highContrast } = useTheme();

  const borderWidth = highContrast ? colors.borderWidth : selected ? 2 : 1;
  const borderColor = highContrast
    ? selected ? colors.textPrimary : colors.border
    : selected ? colors.accent : colors.border;
  const backgroundColor = highContrast
    ? colors.surface
    : selected ? colors.accent : colors.surfaceSecondary;
  const textColor = highContrast
    ? colors.textPrimary
    : selected ? colors.surface : colors.textSecondary;

  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          minHeight: touchTargetSize,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, { color: textColor, fontSize: typography.sm }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
