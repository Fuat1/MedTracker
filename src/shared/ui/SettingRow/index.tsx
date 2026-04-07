import React from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: string;
  iconColor?: string;
}

export function SettingRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  iconColor,
}: SettingRowProps) {
  const {colors, typography} = useTheme();
  return (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconCircle, {backgroundColor: colors.iconCircleBg}]}>
          <Icon name={icon} size={18} color={iconColor ?? colors.accent} />
        </View>
      )}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            {color: colors.textPrimary, fontSize: typography.sm},
          ]}>
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              {color: colors.textSecondary, fontSize: typography.xs},
            ]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.toggleTrackInactive,
          true: colors.toggleTrackActive,
        }}
        thumbColor={colors.toggleThumb}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{checked: value, disabled}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {flex: 1},
  label: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  description: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
});
