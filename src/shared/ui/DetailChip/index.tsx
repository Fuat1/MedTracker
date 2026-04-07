import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface DetailChipProps {
  label: string;
  icon?: string;
  color?: string;
}

export function DetailChip({label, icon, color}: DetailChipProps) {
  const {colors, typography} = useTheme();
  const chipColor = color ?? colors.textSecondary;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.borderLight,
        },
      ]}>
      {icon && <Icon name={icon} size={14} color={chipColor} />}
      <Text
        style={[
          styles.label,
          {color: chipColor, fontSize: typography.xs},
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
});
