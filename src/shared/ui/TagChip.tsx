import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface TagChipProps {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  fontScale?: number;
  disabled?: boolean;
}

export function TagChip({ icon, label, selected, onPress, onLongPress, fontScale = 1, disabled }: TagChipProps) {
  const { colors } = useTheme();
  const iconSize = Math.round(14 * fontScale);

  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent + '18' : colors.surfaceSecondary,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Icon
        name={selected ? icon.replace('-outline', '') : icon}
        size={iconSize}
        color={selected ? colors.accent : colors.textSecondary}
      />
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.accent : colors.textSecondary,
            fontSize: Math.round(12 * fontScale),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  chipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
