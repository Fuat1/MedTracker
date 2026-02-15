import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
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
  const chipTextStyle = { color: selected ? '#ffffff' : colors.textSecondary };
  return (
    <TouchableOpacity
      style={[styles.chip, chipBgStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, chipTextStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
