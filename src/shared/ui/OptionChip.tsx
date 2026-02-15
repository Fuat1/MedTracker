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
  const { colors } = useTheme();
  const chipBgStyle = { backgroundColor: selected ? colors.accent : colors.surfaceSecondary };
  const chipTextStyle = { color: selected ? colors.surface : colors.textSecondary };
  return (
    <Pressable
      style={[styles.chip, chipBgStyle]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, chipTextStyle]}>
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
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
